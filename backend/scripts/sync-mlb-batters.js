// Sync hitting stats (season + vs RHP + vs LHP) for all teams playing today.
// Usage: node scripts/sync-mlb-batters.js [YYYY-MM-DD] [SEASON]

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DATE = process.argv[2] || new Date().toISOString().slice(0, 10);
const SEASON = parseInt(process.argv[3] || new Date(DATE).getUTCFullYear());

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
}

function parseNum(v) {
  if (v == null || v === '-.--' || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function kPct(stat) {
  const pa = stat.plateAppearances || 0;
  const k = stat.strikeOuts || 0;
  return pa > 0 ? +(k * 100 / pa).toFixed(2) : null;
}

async function fetchTeamHitters(mlbTeamId) {
  // 1. Roster to get player names + positions + bats hand
  const roster = await fetchJson(`https://statsapi.mlb.com/api/v1/teams/${mlbTeamId}/roster?rosterType=active&season=${SEASON}`);
  const byId = new Map();
  for (const r of roster.roster || []) {
    if (r.position.abbreviation === 'P' || r.position.abbreviation === 'TWP') continue;
    byId.set(r.person.id, { fullName: r.person.fullName, position: r.position.abbreviation, bats: null });
  }

  // 2. Season hitting stats by player
  const season = await fetchJson(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&teamId=${mlbTeamId}&season=${SEASON}&sportId=1&limit=200&playerPool=All`);
  for (const sp of season.stats?.[0]?.splits || []) {
    const pid = sp.player?.id;
    if (!byId.has(pid)) continue;
    const e = byId.get(pid);
    e.season = {
      ab: sp.stat.atBats || 0,
      avg: parseNum(sp.stat.avg),
      hr: sp.stat.homeRuns || 0,
      rbi: sp.stat.rbi || 0,
      ops: parseNum(sp.stat.ops),
      kpct: kPct(sp.stat),
    };
  }

  // 3. Splits vs RHP/LHP
  const splits = await fetchJson(`https://statsapi.mlb.com/api/v1/stats?stats=statSplits&group=hitting&teamId=${mlbTeamId}&season=${SEASON}&sitCodes=vr,vl&sportId=1&limit=400&playerPool=All`);
  for (const sp of splits.stats?.[0]?.splits || []) {
    const pid = sp.player?.id;
    if (!byId.has(pid)) continue;
    const code = sp.split?.code; // vr or vl
    const payload = {
      ab: sp.stat.atBats || 0,
      avg: parseNum(sp.stat.avg),
      hr: sp.stat.homeRuns || 0,
      rbi: sp.stat.rbi || 0,
      ops: parseNum(sp.stat.ops),
      kpct: kPct(sp.stat),
    };
    const e = byId.get(pid);
    if (code === 'vr') e.vr = payload;
    else if (code === 'vl') e.vl = payload;
  }

  // 4. Bats hand via roster (needs hydrate) — fetch people in one call
  const ids = [...byId.keys()];
  if (ids.length) {
    const people = await fetchJson(`https://statsapi.mlb.com/api/v1/people?personIds=${ids.join(',')}`);
    for (const p of people.people || []) {
      if (byId.has(p.id)) byId.get(p.id).bats = p.batSide?.code || null;
    }
  }

  // Keep only players with at-bats this season
  return [...byId.entries()]
    .filter(([, e]) => e.season && e.season.ab > 0)
    .map(([mlbId, e]) => ({ mlbId, ...e }));
}

async function run() {
  const client = await pool.connect();
  try {
    // Find all teams playing on DATE (in MX TZ)
    const res = await client.query(
      `SELECT DISTINCT t.id AS db_id, t.name FROM matches m
         JOIN teams t ON t.id IN (m.home_team_id, m.away_team_id)
        WHERE m.league_id=3
          AND DATE(m.match_date AT TIME ZONE 'America/Mexico_City')=$1`,
      [DATE]
    );
    if (!res.rows.length) {
      console.log('No MLB teams play on', DATE);
      return;
    }
    console.log(`Syncing batters for ${res.rows.length} teams (${SEASON})...`);
    const teamsList = await fetchJson(`https://statsapi.mlb.com/api/v1/teams?sportId=1&season=${SEASON}`);

    for (const { db_id, name } of res.rows) {
      const mlbTeam = teamsList.teams.find(t => t.name === name);
      if (!mlbTeam) { console.warn(`  skip (no mlb team match): ${name}`); continue; }

      const hitters = await fetchTeamHitters(mlbTeam.id);
      await client.query(`DELETE FROM team_batters_splits WHERE team_id=$1 AND season_year=$2`, [db_id, SEASON]);
      for (const h of hitters) {
        await client.query(
          `INSERT INTO team_batters_splits
            (team_id, mlb_player_id, full_name, position, bats, season_year,
             season_ab, season_avg, season_hr, season_rbi, season_ops, season_k_pct,
             vr_ab, vr_avg, vr_hr, vr_rbi, vr_ops, vr_k_pct,
             vl_ab, vl_avg, vl_hr, vl_rbi, vl_ops, vl_k_pct)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
          [
            db_id, h.mlbId, h.fullName, h.position, h.bats, SEASON,
            h.season?.ab, h.season?.avg, h.season?.hr, h.season?.rbi, h.season?.ops, h.season?.kpct,
            h.vr?.ab ?? null, h.vr?.avg ?? null, h.vr?.hr ?? null, h.vr?.rbi ?? null, h.vr?.ops ?? null, h.vr?.kpct ?? null,
            h.vl?.ab ?? null, h.vl?.avg ?? null, h.vl?.hr ?? null, h.vl?.rbi ?? null, h.vl?.ops ?? null, h.vl?.kpct ?? null,
          ]
        );
      }
      console.log(`  ✓ ${name}: ${hitters.length} batters`);
    }
  } catch (err) {
    console.error('ERROR:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
