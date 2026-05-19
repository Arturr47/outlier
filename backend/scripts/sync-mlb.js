// Sync MLB data from the free MLB Stats API into the local DB.
// Usage: node scripts/sync-mlb.js [YYYY-MM-DD]
// Default date = today (system date).

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DATE = process.argv[2] || new Date().toISOString().slice(0, 10);
const LEAGUE_ID = 3; // MLB

// Canonical short codes (MLB Stats API doesn't expose abbrev cleanly)
const SHORT_BY_NAME = {
  'Arizona Diamondbacks': 'ARI', 'Atlanta Braves': 'ATL', 'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS', 'Chicago Cubs': 'CHC', 'Chicago White Sox': 'CWS',
  'Cincinnati Reds': 'CIN', 'Cleveland Guardians': 'CLE', 'Colorado Rockies': 'COL',
  'Detroit Tigers': 'DET', 'Houston Astros': 'HOU', 'Kansas City Royals': 'KC',
  'Los Angeles Angels': 'LAA', 'Los Angeles Dodgers': 'LAD', 'Miami Marlins': 'MIA',
  'Milwaukee Brewers': 'MIL', 'Minnesota Twins': 'MIN', 'New York Mets': 'NYM',
  'New York Yankees': 'NYY', 'Athletics': 'ATH', 'Oakland Athletics': 'OAK',
  'Philadelphia Phillies': 'PHI', 'Pittsburgh Pirates': 'PIT', 'San Diego Padres': 'SD',
  'San Francisco Giants': 'SF', 'Seattle Mariners': 'SEA', 'St. Louis Cardinals': 'STL',
  'Tampa Bay Rays': 'TB', 'Texas Rangers': 'TEX', 'Toronto Blue Jays': 'TOR',
  'Washington Nationals': 'WSH',
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
}

async function fetchPitcherStats(playerId, opponentMlbId, seasonYear) {
  // Fetch season + vsTeam pitching stats. Returns {season:{...}, vs:{...}} with null if no data.
  const url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season,vsTeam&group=pitching&season=${seasonYear}&opposingTeamId=${opponentMlbId}`;
  let data;
  try { data = await fetchJson(url); } catch { return { season: null, vs: null, throws: null }; }
  const result = { season: null, vs: null };
  for (const s of data.stats || []) {
    const typeName = s.type?.displayName;
    const split = s.splits?.[0]?.stat;
    if (!split) continue;
    const parsed = {
      wins: split.wins ?? 0,
      losses: split.losses ?? 0,
      era: parseFloat(split.era) || 0,
      ip: parseFloat(split.inningsPitched) || 0,
      hits_per9: parseFloat(split.hitsPer9Inn) || 0,
      k_per9: parseFloat(split.strikeoutsPer9Inn) || 0,
      bb_per9: parseFloat(split.walksPer9Inn) || 0,
      whip: parseFloat(split.whip) || 0,
    };
    if (typeName === 'season') result.season = parsed;
    else if (typeName === 'vsTeam') result.vs = parsed;
  }
  // Get throws hand
  let throws = null;
  try {
    const person = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
    throws = person.people?.[0]?.pitchHand?.code || null;
  } catch {}
  return { ...result, throws };
}

// Derive a simple decimal moneyline from win pcts.
// Higher pct team gets shorter (lower) odds.
function deriveOdds(homePct, awayPct) {
  const hp = Math.max(0.30, Math.min(0.75, homePct + 0.04)); // slight home-field bump
  const ap = Math.max(0.30, Math.min(0.75, awayPct));
  const total = hp + ap;
  const pHome = hp / total;
  const pAway = ap / total;
  const vig = 1.05;
  return {
    home: +(vig / pHome).toFixed(2),
    away: +(vig / pAway).toFixed(2),
  };
}

function deriveStreak(recent) {
  if (!recent.length) return '';
  const first = recent[0].result;
  let n = 0;
  for (const g of recent) {
    if (g.result === first) n++;
    else break;
  }
  return `${first}${n}`;
}

async function upsertTeam(client, mlbTeam) {
  const { id: mlbId, name } = mlbTeam;
  const short = SHORT_BY_NAME[name] || name.slice(0, 3).toUpperCase();
  // Match by exact name first
  const found = await client.query('SELECT id FROM teams WHERE name=$1 AND league_id=$2', [name, LEAGUE_ID]);
  if (found.rows[0]) return { dbId: found.rows[0].id, short, name };
  const ins = await client.query(
    `INSERT INTO teams (league_id, name, short_name, city) VALUES ($1,$2,$3,$4) RETURNING id`,
    [LEAGUE_ID, name, short, name.split(' ').slice(0, -1).join(' ')]
  );
  return { dbId: ins.rows[0].id, short, name };
}

async function run() {
  const client = await pool.connect();
  try {
    console.log(`\nSyncing MLB for ${DATE}...`);

    // 1. Fetch today's schedule (with probable pitchers hydrated)
    const sched = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${DATE}&hydrate=probablePitcher`);
    const games = sched.dates[0]?.games || [];
    console.log(`Found ${games.length} games.`);

    await client.query('BEGIN');

    // 2. Wipe MLB data for this date (and related)
    const dateFilter = `match_id IN (SELECT id FROM matches WHERE league_id=$1 AND DATE(match_date)=$2)`;
    await client.query(`DELETE FROM public_betting WHERE ${dateFilter}`, [LEAGUE_ID, DATE]);
    await client.query(`DELETE FROM player_props  WHERE ${dateFilter}`, [LEAGUE_ID, DATE]);
    await client.query(`DELETE FROM lineups       WHERE ${dateFilter}`, [LEAGUE_ID, DATE]);
    await client.query(`DELETE FROM odds          WHERE ${dateFilter}`, [LEAGUE_ID, DATE]);
    await client.query(`DELETE FROM probable_pitchers WHERE ${dateFilter}`, [LEAGUE_ID, DATE]);
    await client.query(`DELETE FROM matches WHERE league_id=$1 AND DATE(match_date)=$2`, [LEAGUE_ID, DATE]);

    // 3. Upsert all teams referenced today, collect mlb->db id map + pct
    const teamMap = new Map(); // mlbId -> {dbId, short, name, wins, losses, pct}
    for (const g of games) {
      for (const side of ['home', 'away']) {
        const t = g.teams[side].team;
        const rec = g.teams[side].leagueRecord || {};
        if (!teamMap.has(t.id)) {
          const { dbId, short, name } = await upsertTeam(client, t);
          teamMap.set(t.id, { dbId, short, name, wins: rec.wins || 0, losses: rec.losses || 0, pct: parseFloat(rec.pct) || 0.5 });
        }
      }
    }

    // 4. Fetch recent games (last ~3 weeks) for each team to populate team_games
    const startDate = new Date(new Date(DATE).getTime() - 21 * 86400000).toISOString().slice(0, 10);
    const endDate   = new Date(new Date(DATE).getTime() -  1 * 86400000).toISOString().slice(0, 10);
    for (const [mlbId, info] of teamMap) {
      const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${mlbId}&startDate=${startDate}&endDate=${endDate}`;
      const data = await fetchJson(url);
      const recent = [];
      for (const dt of data.dates || []) {
        for (const gm of dt.games) {
          if (gm.status.codedGameState !== 'F') continue;
          const isHome = gm.teams.home.team.id === mlbId;
          const me = isHome ? gm.teams.home : gm.teams.away;
          const them = isHome ? gm.teams.away : gm.teams.home;
          if (typeof me.score !== 'number' || typeof them.score !== 'number') continue;
          const oppMlbId = them.team.id;
          // Ensure opponent is in DB (could be a non-today team)
          let oppDbId;
          if (teamMap.has(oppMlbId)) oppDbId = teamMap.get(oppMlbId).dbId;
          else {
            const up = await upsertTeam(client, them.team);
            oppDbId = up.dbId;
            teamMap.set(oppMlbId, { dbId: up.dbId, short: up.short, name: up.name, wins: them.leagueRecord?.wins||0, losses: them.leagueRecord?.losses||0, pct: parseFloat(them.leagueRecord?.pct)||0.5 });
          }
          recent.push({
            date: gm.officialDate,
            isHome,
            myScore: me.score,
            oppScore: them.score,
            result: me.score > them.score ? 'W' : me.score < them.score ? 'L' : 'D',
            oppDbId,
          });
        }
      }
      recent.sort((a, b) => b.date.localeCompare(a.date));
      const last10 = recent.slice(0, 10);

      // Replace team_games for this team in the window
      await client.query('DELETE FROM team_games WHERE team_id=$1 AND game_date >= $2', [info.dbId, startDate]);
      for (const r of last10) {
        await client.query(
          `INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [info.dbId, r.oppDbId, r.date, r.isHome, r.myScore, r.oppScore, r.result, LEAGUE_ID]
        );
      }

      // Update team record + streak
      await client.query(
        `UPDATE teams SET wins=$1, losses=$2, ties=0, win_pct=$3, streak=$4 WHERE id=$5`,
        [info.wins, info.losses, info.pct, deriveStreak(last10), info.dbId]
      );
    }

    // 5. Insert today's matches + derived odds + public betting
    for (const g of games) {
      const homeInfo = teamMap.get(g.teams.home.team.id);
      const awayInfo = teamMap.get(g.teams.away.team.id);
      const statusMap = { F: 'finished', I: 'live', P: 'scheduled', S: 'scheduled' };
      const status = statusMap[g.status.codedGameState] || 'scheduled';
      const homeScore = typeof g.teams.home.score === 'number' ? g.teams.home.score : null;
      const awayScore = typeof g.teams.away.score === 'number' ? g.teams.away.score : null;

      const ins = await client.query(
        `INSERT INTO matches (league_id, home_team_id, away_team_id, match_date, status, venue, home_score, away_score)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [LEAGUE_ID, homeInfo.dbId, awayInfo.dbId, g.gameDate, status, g.venue.name, homeScore, awayScore]
      );
      const matchId = ins.rows[0].id;

      // Derive odds from both teams' pct
      const base = deriveOdds(homeInfo.pct, awayInfo.pct);
      const books = [
        { name: 'Caliente', h: base.home,                a: base.away },
        { name: 'Bet365',   h: +(base.home*1.015).toFixed(2), a: +(base.away*0.985).toFixed(2) },
        { name: 'Betcris',  h: +(base.home*0.985).toFixed(2), a: +(base.away*1.015).toFixed(2) },
      ];
      for (const b of books) {
        await client.query(
          `INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES ($1,$2,'moneyline',$3,$4)`,
          [matchId, b.name, b.h, b.a]
        );
      }
      // Spread -1.5 (run line)
      const rlHome = +(base.home * 1.35).toFixed(2);
      const rlAway = +(base.away * 0.78).toFixed(2);
      await client.query(
        `INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES ($1,'Caliente','spread',-1.5,$2,$3)`,
        [matchId, rlHome, rlAway]
      );
      // O/U
      const total = homeInfo.pct + awayInfo.pct > 1.2 ? 9.0 : 8.5;
      await client.query(
        `INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES ($1,'Caliente','over_under',$2,1.87,1.95)`,
        [matchId, total]
      );
      await client.query(
        `INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES ($1,'Bet365','over_under',$2,1.91,1.91)`,
        [matchId, total]
      );

      // Public betting — moneyline, spread, over/under
      const favIsHome = homeInfo.pct >= awayInfo.pct;
      const favBets   = 55 + Math.round(Math.abs(homeInfo.pct - awayInfo.pct) * 60);
      const homeBets  = favIsHome ? favBets : 100 - favBets;
      // Spread: underdog gets more bets on spread, slight shift
      const homeSpreadBets = Math.max(30, Math.min(70, homeBets - 8));
      // O/U: roughly 50/50 with slight lean based on combined offense
      const overBets = homeInfo.pct + awayInfo.pct > 1.0 ? 54 : 48;
      for (const [betType, hBets, hMoney] of [
        ['moneyline',  homeBets,        homeBets + 3],
        ['spread',     homeSpreadBets,  homeSpreadBets + 2],
        ['over_under', overBets,        overBets + 3],
      ]) {
        await client.query(
          `INSERT INTO public_betting (match_id, bet_type, home_pct_bets, away_pct_bets, home_pct_money, away_pct_money)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [matchId, betType, hBets, 100 - hBets, hMoney, 100 - hMoney]
        );
      }

      // Probable pitchers
      const seasonYear = new Date(DATE).getUTCFullYear();
      const sides = [
        { pp: g.teams.home.probablePitcher, teamInfo: homeInfo, oppMlbId: g.teams.away.team.id },
        { pp: g.teams.away.probablePitcher, teamInfo: awayInfo, oppMlbId: g.teams.home.team.id },
      ];
      for (const s of sides) {
        if (!s.pp?.id) continue;
        const st = await fetchPitcherStats(s.pp.id, s.oppMlbId, seasonYear);
        await client.query(
          `INSERT INTO probable_pitchers
            (match_id, team_id, mlb_player_id, full_name, throws, season_year,
             season_wins, season_losses, season_era, season_ip, season_hits_per9, season_k_per9, season_bb_per9, season_whip,
             vs_wins, vs_losses, vs_era, vs_ip, vs_hits_per9, vs_k_per9, vs_bb_per9, vs_whip)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
          [
            matchId, s.teamInfo.dbId, s.pp.id, s.pp.fullName, st.throws, seasonYear,
            st.season?.wins ?? null, st.season?.losses ?? null, st.season?.era ?? null,
            st.season?.ip ?? null, st.season?.hits_per9 ?? null, st.season?.k_per9 ?? null,
            st.season?.bb_per9 ?? null, st.season?.whip ?? null,
            st.vs?.wins ?? null, st.vs?.losses ?? null, st.vs?.era ?? null,
            st.vs?.ip ?? null, st.vs?.hits_per9 ?? null, st.vs?.k_per9 ?? null,
            st.vs?.bb_per9 ?? null, st.vs?.whip ?? null,
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`✓ Inserted ${games.length} matches, ${teamMap.size} teams touched.`);
    games.forEach(g => {
      const h = teamMap.get(g.teams.home.team.id);
      const a = teamMap.get(g.teams.away.team.id);
      console.log(`  ${a.short} (${a.wins}-${a.losses}) @ ${h.short} (${h.wins}-${h.losses})  [${g.status.detailedState}]`);
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
