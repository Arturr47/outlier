const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

async function requirePremium(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const now = new Date();

    // Check trial
    if (user.status === 'trial' && user.trial_ends_at && new Date(user.trial_ends_at) > now) {
      return next();
    }

    // Check active subscription
    if (user.status === 'active') {
      return next();
    }

    return res.status(403).json({
      error: 'Suscripción requerida',
      message: 'Tu prueba gratuita ha expirado. Suscríbete por $150 MXN/mes para continuar.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error del servidor' });
  }
}

module.exports = { authenticateToken, requirePremium };
