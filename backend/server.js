const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Webhook de Stripe necesita raw body - debe ir ANTES de express.json()
const webhookRoutes = require('./routes/webhook');
app.use('/api/webhook', webhookRoutes);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');
const matchesRoutes = require('./routes/matches');
const picksRoutes = require('./routes/picks');
const leaguesRoutes = require('./routes/leagues');

app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/picks', picksRoutes);
app.use('/api/leagues', leaguesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Outlier Mexicano API funcionando' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Outlier Mexicano API en puerto ${PORT}`);

  // Auto-sync MLB data: once on boot, then daily at 00:00 America/Mexico_City.
  const cron = require('node-cron');
  const { run: dailySync } = require('./scripts/daily-sync');

  let syncing = false;
  const runSync = (label) => {
    if (syncing) return console.log(`[${label}] skipped (already running)`);
    syncing = true;
    console.log(`[${label}] starting...`);
    dailySync()
      .catch(err => console.error(`[${label}] error:`, err))
      .finally(() => { syncing = false; });
  };

  // Kick off once on boot (non-blocking)
  runSync('boot-sync');

  // Daily at 00:00 MX time
  cron.schedule('0 0 * * *', () => runSync('daily-sync'), { timezone: 'America/Mexico_City' });
  console.log('Daily MLB sync scheduled for 00:00 America/Mexico_City.');
});
