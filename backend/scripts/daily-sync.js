// Daily sync: cleans up old MLB matches and loads today's (in America/Mexico_City).
// Used by server.js on boot + daily cron. Can also be run manually:
//   node scripts/daily-sync.js [YYYY-MM-DD]

require('dotenv').config();
const { Pool } = require('pg');
const { spawn } = require('child_process');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function todayInMX() {
  // Returns YYYY-MM-DD for today in America/Mexico_City.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

async function cleanupOldMatches(keepFromDate) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dateFilter = `match_id IN (SELECT id FROM matches WHERE league_id=3 AND DATE(match_date AT TIME ZONE 'America/Mexico_City') < $1)`;
    await client.query(`DELETE FROM public_betting      WHERE ${dateFilter}`, [keepFromDate]);
    await client.query(`DELETE FROM player_props        WHERE ${dateFilter}`, [keepFromDate]);
    await client.query(`DELETE FROM lineups             WHERE ${dateFilter}`, [keepFromDate]);
    await client.query(`DELETE FROM odds                WHERE ${dateFilter}`, [keepFromDate]);
    await client.query(`DELETE FROM probable_pitchers   WHERE ${dateFilter}`, [keepFromDate]);
    const r = await client.query(
      `DELETE FROM matches WHERE league_id=3 AND DATE(match_date AT TIME ZONE 'America/Mexico_City') < $1`,
      [keepFromDate]
    );
    await client.query('COMMIT');
    return r.rowCount;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

function runScript(file, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, file), ...args], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${file} exited with ${code}`)));
    child.on('error', reject);
  });
}

async function run(date) {
  const target = date || todayInMX();
  console.log(`\n[daily-sync] Target date: ${target}`);

  try {
    const removed = await cleanupOldMatches(target);
    console.log(`[daily-sync] Removed ${removed} old MLB matches.`);
  } catch (e) {
    console.error('[daily-sync] Cleanup failed:', e.message);
  }

  try {
    await runScript('sync-mlb.js', [target]);
  } catch (e) {
    console.error('[daily-sync] sync-mlb failed:', e.message);
    return;
  }

  try {
    await runScript('sync-mlb-batters.js', [target]);
  } catch (e) {
    console.error('[daily-sync] sync-mlb-batters failed:', e.message);
  }

  console.log(`[daily-sync] Done for ${target}.`);
}

if (require.main === module) {
  run(process.argv[2]).finally(() => pool.end());
} else {
  module.exports = { run, todayInMX };
}
