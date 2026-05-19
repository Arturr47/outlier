const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Obtener todas las ligas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leagues WHERE active = true ORDER BY id'
    );
    res.json({ leagues: result.rows });
  } catch (err) {
    console.error('Error obteniendo ligas:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener equipos de una liga
router.get('/:slug/teams', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.* FROM teams t
       JOIN leagues l ON t.league_id = l.id
       WHERE l.slug = $1
       ORDER BY t.name`,
      [req.params.slug]
    );
    res.json({ teams: result.rows });
  } catch (err) {
    console.error('Error obteniendo equipos:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
