const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requirePremium } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Obtener partidos por liga y fecha
router.get('/', async (req, res) => {
  try {
    const { league, date } = req.query;

    let query = `
      SELECT
        m.id, m.match_date, m.status, m.home_score, m.away_score, m.venue,
        l.name as league_name, l.slug as league_slug, l.sport,
        ht.name as home_team, ht.short_name as home_short, ht.logo_url as home_logo,
        ht.wins as home_wins, ht.losses as home_losses, ht.ties as home_ties,
        ht.streak as home_streak, ht.win_pct as home_win_pct,
        at.name as away_team, at.short_name as away_short, at.logo_url as away_logo,
        at.wins as away_wins, at.losses as away_losses, at.ties as away_ties,
        at.streak as away_streak, at.win_pct as away_win_pct
      FROM matches m
      JOIN leagues l ON m.league_id = l.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE 1=1
    `;
    const params = [];

    if (league) {
      params.push(league);
      query += ` AND l.slug = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND DATE(m.match_date) = $${params.length}`;
    }

    query += ' ORDER BY m.match_date ASC';

    const result = await pool.query(query, params);

    // Agregar momios + public betting + recent games a cada partido
    const matches = await Promise.all(
      result.rows.map(async (match) => {
        const [oddsResult, pbResult, homeGames, awayGames] = await Promise.all([
          pool.query('SELECT * FROM odds WHERE match_id = $1 ORDER BY sportsbook', [match.id]),
          pool.query('SELECT * FROM public_betting WHERE match_id = $1', [match.id]),
          pool.query(
            'SELECT * FROM team_games WHERE team_id = (SELECT home_team_id FROM matches WHERE id = $1) ORDER BY game_date DESC LIMIT 10',
            [match.id]
          ),
          pool.query(
            'SELECT * FROM team_games WHERE team_id = (SELECT away_team_id FROM matches WHERE id = $1) ORDER BY game_date DESC LIMIT 10',
            [match.id]
          ),
        ]);
        return {
          ...match,
          odds: oddsResult.rows,
          public_betting: pbResult.rows,
          home_recent: homeGames.rows,
          away_recent: awayGames.rows,
        };
      })
    );

    res.json({ matches });
  } catch (err) {
    console.error('Error obteniendo partidos:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Detalle de un partido
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Info del partido con team records
    const matchResult = await pool.query(
      `SELECT
        m.*, l.name as league_name, l.slug as league_slug, l.sport,
        ht.name as home_team, ht.short_name as home_short, ht.id as home_team_id,
        ht.wins as home_wins, ht.losses as home_losses, ht.ties as home_ties,
        ht.streak as home_streak, ht.win_pct as home_win_pct,
        at.name as away_team, at.short_name as away_short, at.id as away_team_id,
        at.wins as away_wins, at.losses as away_losses, at.ties as away_ties,
        at.streak as away_streak, at.win_pct as away_win_pct
      FROM matches m
      JOIN leagues l ON m.league_id = l.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1`,
      [id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const match = matchResult.rows[0];

    // All queries in parallel
    const [odds, h2h, injuries, props, publicBetting, homeGames, awayGames, homeLineup, awayLineup, pitchers, batters] = await Promise.all([
      pool.query('SELECT * FROM odds WHERE match_id = $1', [id]),
      pool.query(
        `SELECT * FROM h2h_records
         WHERE (team_a_id = $1 AND team_b_id = $2)
            OR (team_a_id = $2 AND team_b_id = $1)
         ORDER BY match_date DESC LIMIT 10`,
        [match.home_team_id, match.away_team_id]
      ),
      pool.query(
        `SELECT i.*, p.name as player_name, p.position, t.name as team_name, t.short_name as team_short
         FROM injuries i
         JOIN players p ON i.player_id = p.id
         JOIN teams t ON i.team_id = t.id
         WHERE i.team_id IN ($1, $2)`,
        [match.home_team_id, match.away_team_id]
      ),
      pool.query(
        `SELECT pp.*, p.name as player_name, p.position, t.name as team_name, t.short_name as team_short
         FROM player_props pp
         JOIN players p ON pp.player_id = p.id
         JOIN teams t ON p.team_id = t.id
         WHERE pp.match_id = $1
         ORDER BY pp.hit_rate DESC`,
        [id]
      ),
      pool.query('SELECT * FROM public_betting WHERE match_id = $1', [id]),
      pool.query(
        `SELECT tg.*, t.short_name as opponent_short, t.name as opponent_name
         FROM team_games tg
         JOIN teams t ON tg.opponent_id = t.id
         WHERE tg.team_id = $1
         ORDER BY tg.game_date DESC LIMIT 10`,
        [match.home_team_id]
      ),
      pool.query(
        `SELECT tg.*, t.short_name as opponent_short, t.name as opponent_name
         FROM team_games tg
         JOIN teams t ON tg.opponent_id = t.id
         WHERE tg.team_id = $1
         ORDER BY tg.game_date DESC LIMIT 10`,
        [match.away_team_id]
      ),
      pool.query(
        `SELECT l.*, p.name as player_name, p.position as player_position, p.number as player_number, p.status as player_status
         FROM lineups l
         JOIN players p ON l.player_id = p.id
         WHERE l.match_id = $1 AND l.team_id = $2
         ORDER BY l.position_order`,
        [id, match.home_team_id]
      ),
      pool.query(
        `SELECT l.*, p.name as player_name, p.position as player_position, p.number as player_number, p.status as player_status
         FROM lineups l
         JOIN players p ON l.player_id = p.id
         WHERE l.match_id = $1 AND l.team_id = $2
         ORDER BY l.position_order`,
        [id, match.away_team_id]
      ),
      pool.query('SELECT * FROM probable_pitchers WHERE match_id = $1', [id]),
      pool.query(
        `SELECT * FROM team_batters_splits WHERE team_id IN ($1,$2) ORDER BY team_id, season_ab DESC`,
        [match.home_team_id, match.away_team_id]
      ),
    ]);

    res.json({
      match,
      odds: odds.rows,
      h2h: h2h.rows,
      injuries: injuries.rows,
      props: props.rows,
      public_betting: publicBetting.rows,
      home_recent: homeGames.rows,
      away_recent: awayGames.rows,
      home_lineup: homeLineup.rows,
      away_lineup: awayLineup.rows,
      probable_pitchers: pitchers.rows,
      team_batters: batters.rows,
    });
  } catch (err) {
    console.error('Error obteniendo detalle:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
