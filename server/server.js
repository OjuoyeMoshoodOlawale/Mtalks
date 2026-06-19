process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const path = require('path');
const fs   = require('fs');

/* ── Load .env ─────────────────────────────────────────────────────────── */
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  /* Load .env file if it exists (local dev) */
  const result = require('dotenv').config({ path: envPath });
  if (result.error) {
    console.warn('⚠️  dotenv parse error (continuing with system env):', result.error.message);
  } else {
    console.log('[ENV] Loaded from server/.env file');
  }
} else {
  /* Production: cPanel injects env vars directly — no .env file needed */
  console.log('[ENV] No .env file found — using system/cPanel environment variables');
}

/* ── Validate required vars ────────────────────────────────────────────── */
const REQUIRED = [
  'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME',
  'JWT_SECRET', 'JWT_REFRESH_SECRET',
];
/* Use 'in' check — allows empty string values (e.g. DB_PASS= for no password) */
const missing = REQUIRED.filter(k => !(k in process.env));
if (missing.length) {
  console.error('\n' + '═'.repeat(60));
  console.error('  ❌  Missing required environment variables:');
  missing.forEach(k => console.error('      •', k));
  console.error('');
  console.error('  Open server/.env and fill in the missing values.');
  console.error('═'.repeat(60) + '\n');
  process.exit(1);
}

/* ── Warn about optional-but-important vars ───────────────────────────── */
const WARN_IF_MISSING = {
  SMTP_PASS:            'Emails will not send (cPanel SMTP)',
  PAYSTACK_SECRET_KEY:  'Payments will not verify with Paystack',
  GMAIL_APP_PASSWORD:   'No Gmail fallback for email',
};
const warnings = Object.entries(WARN_IF_MISSING)
  .filter(([k]) => !(k in process.env) || process.env[k].startsWith('REPLACE_'))
  .map(([k, reason]) => `  ⚠️  ${k} not set — ${reason}`);

if (warnings.length) {
  console.warn('\n' + '─'.repeat(60));
  console.warn('  Environment warnings:');
  warnings.forEach(w => console.warn(w));
  console.warn('─'.repeat(60));
}

/* ── Print loaded config summary (no secrets) ─────────────────────────── */
console.log('\n[ENV] ✅ Loaded server/.env successfully');
console.log('[ENV]  NODE_ENV  :', process.env.NODE_ENV);
console.log('[ENV]  PORT      :', process.env.PORT || 5000);
console.log('[ENV]  DB_HOST   :', process.env.DB_HOST);
console.log('[ENV]  DB_NAME   :', process.env.DB_NAME);
console.log('[ENV]  SMTP_HOST :', process.env.SMTP_HOST || '(not set)');
console.log('[ENV]  SMTP_USER :', process.env.SMTP_USER || '(not set)');
console.log('[ENV]  PAYSTACK  :', process.env.PAYSTACK_SECRET_KEY ? '✅ key set' : '❌ not set');
console.log('[ENV]  JWT       :', process.env.JWT_SECRET ? '✅ set' : '❌ not set');
console.log('');

/* ── Start app ─────────────────────────────────────────────────────────── */
const app    = require('./src/app');
const logger = require('./src/utils/logger');
const db     = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.query('SELECT 1');
    logger.info('Database connection established');

    const server = app.listen(PORT, () => {
      logger.info(`[MTalks API] Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n  Port ${PORT} is already in use.\n`);
        console.error(`  Kill with:  kill -9 $(lsof -ti :${PORT})\n`);
        process.exit(1);
      } else {
        logger.error('Server error', { error: err.message });
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error('Failed to connect to database', { error: err.message });
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});
