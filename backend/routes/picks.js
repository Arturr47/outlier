const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requirePremium } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Obtener mis picks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT up.*,
        m.match_date, m.status as match_status,
        ht.name as home_team, ht.short_name as home_short,
        at.name as away_team, at.short_name as away_short,
        l.name as league_name, l.slug as league_slug
      FROM user_picks up
      JOIN matches m ON up.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN leagues l ON m.league_id = l.id
      WHERE up.user_id = $1
      ORDER BY up.created_at DESC`,
      [req.user.id]
    );

    res.json({ picks: result.rows });
  } catch (err) {
    console.error('Error obteniendo picks:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Agregar pick
router.post('/', authenticateToken, requirePremium, async (req, res) => {
  try {
    const { matchId, pickType, pickValue, odds, sportsbook, notes } = req.body;

    if (!matchId || !pickType || !pickValue) {
      return res.status(400).json({ error: 'matchId, pickType y pickValue son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO user_picks (user_id, match_id, pick_type, pick_value, odds, sportsbook, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, matchId, pickType, pickValue, odds || null, sportsbook || null, notes || null]
    );

    res.status(201).json({ pick: result.rows[0] });
  } catch (err) {
    console.error('Error guardando pick:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar pick
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM user_picks WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pick no encontrado' });
    }

    res.json({ message: 'Pick eliminado' });
  } catch (err) {
    console.error('Error eliminando pick:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
