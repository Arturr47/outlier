const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Verificar si ya existe
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 5); // 5 días de prueba

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, status, trial_ends_at)
       VALUES ($1, $2, $3, 'trial', $4)
       RETURNING id, email, name, status, trial_ends_at`,
      [email, passwordHash, name || null, trialEndsAt]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        trialEndsAt: user.trial_ends_at,
      },
      token,
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Check subscription status
    const now = new Date();
    let status = user.status;
    if (user.status === 'trial' && user.trial_ends_at && new Date(user.trial_ends_at) < now) {
      status = 'expired';
      await pool.query("UPDATE users SET status = 'expired' WHERE id = $1", [user.id]);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status,
        trialEndsAt: user.trial_ends_at,
      },
      token,
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener perfil
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, name, status, trial_ends_at, subscription_ends_at, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const now = new Date();

    // Auto-expire trial
    if (user.status === 'trial' && user.trial_ends_at && new Date(user.trial_ends_at) < now) {
      user.status = 'expired';
      await pool.query("UPDATE users SET status = 'expired' WHERE id = $1", [user.id]);
    }

    res.json({ user });
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
});

module.exports = router;
