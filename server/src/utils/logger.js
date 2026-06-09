const winston = require('winston');
const db      = require('../config/db');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const extra = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${ts} [${level}] ${message} ${extra}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), winston.format.json());

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()]
});

/* Persist error-level logs to DB for the admin error log viewer */
logger.on('data', async (log) => {
  if (log.level !== 'error' || !log.route) return;
  try {
    await db.query(
      'INSERT INTO error_logs (route, message, stack, user_id) VALUES (?, ?, ?, ?)',
      [log.route || null, log.message || null, log.stack || null, log.userId || null]
    );
  } catch (_) { /* silently ignore DB write failures in the logger */ }
});

module.exports = logger;
