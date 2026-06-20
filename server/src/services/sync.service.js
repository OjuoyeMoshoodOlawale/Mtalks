/**
 * Remote Database Sync Service — Muhsinah Academy
 *
 * Pushes unsynced rows (is_sync = 0) from the local DB to a remote
 * read-only mirror database, then marks them is_sync = 1.
 *
 * Every table with an is_sync column is included.
 * Deletions are not synced (append-only mirror).
 */

const mysql  = require('mysql2/promise');
const db     = require('../config/db');
const logger = require('../utils/logger');

/* All tables that have an is_sync column */
const SYNC_TABLES = [
  /* auth */
  'users',
  /* courses */
  'courses', 'modules', 'lessons', 'enrollments',
  'lesson_progress', 'evaluations', 'eval_questions', 'eval_attempts',
  /* events */
  'events', 'event_packages', 'event_registrations',
  /* payments & comms */
  'payments', 'contacts', 'certificates', 'email_logs', 'error_logs',
  /* content */
  'team_members', 'testimonials', 'faqs', 'settings',
  'gallery_images', 'bot_knowledge',
];

/* ── Get sync settings from local DB ── */
async function getSyncSettings() {
  const [[row]] = await db.query(
    'SELECT * FROM sync_settings WHERE id = 1 LIMIT 1'
  );
  return row || null;
}

/* ── Open a connection to the remote DB ── */
async function openRemoteConnection(cfg) {
  return mysql.createConnection({
    host:     cfg.remote_host,
    port:     cfg.remote_port || 3306,
    user:     cfg.remote_user,
    password: cfg.remote_password,
    database: cfg.remote_database,
    ssl:      { rejectUnauthorized: false },
    connectTimeout: 10000,
  });
}

/* ── Get columns for a table (excludes is_sync) ── */
async function getColumns(conn, table) {
  const [rows] = await conn.query(
    `SHOW COLUMNS FROM \`${table}\``
  );
  return rows.map(r => r.Field);
}

/* ── Ensure remote table has is_sync column ── */
async function ensureRemoteTable(remoteConn, localConn, table) {
  // Get create statement from local
  const [[{ 'Create Table': createSql }]] = await localConn.query(
    `SHOW CREATE TABLE \`${table}\``
  );
  // Create remote table if not exists (ignore duplicate index errors)
  const safeCreate = createSql.replace(/^CREATE TABLE/, 'CREATE TABLE IF NOT EXISTS');
  await remoteConn.query(safeCreate).catch(() => {}); // table might already exist
  // Ensure is_sync column exists remotely
  await remoteConn.query(
    `ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS is_sync TINYINT(1) DEFAULT 1`
  ).catch(() => {});
}

/* ── Sync a single table ── */
async function syncTable(remoteConn, table, batchSize = 500) {
  let totalRows = 0;

  try {
    // Check if local table has is_sync column
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'is_sync'`);
    if (!cols.length) return { rows: 0, skipped: true };

    // Get all column names (to build INSERT)
    const allCols = await getColumns(db, table);
    const colList = allCols.map(c => `\`${c}\``).join(', ');
    const placeholders = allCols.map(() => '?').join(', ');
    const updateSet = allCols
      .filter(c => c !== 'id')
      .map(c => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(', ');

    // Fetch unsynced rows in batches
    while (true) {
      const [rows] = await db.query(
        `SELECT * FROM \`${table}\` WHERE is_sync = 0 LIMIT ?`,
        [batchSize]
      );
      if (!rows.length) break;

      const ids = rows.map(r => r.id).filter(Boolean);

      // Upsert to remote DB
      for (const row of rows) {
        const values = allCols.map(c => row[c] !== undefined ? row[c] : null);
        await remoteConn.query(
          `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders})
           ON DUPLICATE KEY UPDATE ${updateSet}`,
          values
        ).catch(err => {
          logger.warn(`sync: failed to upsert ${table} row ${row.id}: ${err.message}`);
        });
      }

      // Mark as synced locally
      if (ids.length) {
        await db.query(
          `UPDATE \`${table}\` SET is_sync = 1 WHERE id IN (${ids.map(() => '?').join(',')})`,
          ids
        );
      }

      totalRows += rows.length;
      if (rows.length < batchSize) break; // no more
    }

    return { rows: totalRows, skipped: false };
  } catch (err) {
    logger.warn(`sync: error on table ${table}: ${err.message}`);
    return { rows: totalRows, error: err.message };
  }
}

/* ── Main sync function ── */
async function runSync() {
  const cfg = await getSyncSettings();

  if (!cfg || !cfg.sync_enabled) {
    logger.info('sync: disabled or not configured');
    return { status: 'disabled' };
  }
  if (!cfg.remote_host || !cfg.remote_user || !cfg.remote_database) {
    logger.warn('sync: remote DB not fully configured');
    return { status: 'misconfigured' };
  }

  // Start sync log
  const [logResult] = await db.query(
    'INSERT INTO sync_logs (status) VALUES (?)', ['running']
  );
  const logId = logResult.insertId;
  const startedAt = new Date();

  let remoteConn;
  let totalRows = 0;
  let totalFailed = 0;
  let tablesSynced = 0;
  const details = {};

  try {
    logger.info(`sync: connecting to ${cfg.remote_host}:${cfg.remote_port || 3306}/${cfg.remote_database}`);
    remoteConn = await openRemoteConnection(cfg);

    // Ensure sync_logs exists on remote too
    await remoteConn.query(`CREATE TABLE IF NOT EXISTS sync_logs LIKE sync_logs`).catch(() => {});

    for (const table of SYNC_TABLES) {
      try {
        await ensureRemoteTable(remoteConn, db, table);
        const result = await syncTable(remoteConn, table);
        if (!result.skipped) {
          details[table] = result.rows;
          totalRows += result.rows;
          if (result.error) totalFailed++;
          else tablesSynced++;
        }
      } catch (tableErr) {
        logger.warn(`sync: table ${table} failed: ${tableErr.message}`);
        details[table] = `ERROR: ${tableErr.message}`;
        totalFailed++;
      }
    }

    const finishedAt = new Date();
    const status = totalFailed === 0 ? 'success' : totalRows > 0 ? 'partial' : 'failed';

    // Update sync log
    await db.query(
      `UPDATE sync_logs SET finished_at=?, tables_synced=?, rows_synced=?, rows_failed=?, status=?, details=? WHERE id=?`,
      [finishedAt, tablesSynced, totalRows, totalFailed, status, JSON.stringify(details), logId]
    );

    // Update sync settings
    await db.query(
      `UPDATE sync_settings SET last_synced_at=?, last_sync_status=?, last_sync_error=NULL WHERE id=1`,
      [finishedAt, status]
    );

    logger.info(`sync: complete — ${totalRows} rows across ${tablesSynced} tables (${status})`);
    return { status, totalRows, tablesSynced, details };

  } catch (err) {
    logger.error('sync: fatal error', { error: err.message });
    await db.query(
      `UPDATE sync_logs SET finished_at=NOW(), status='failed', error=? WHERE id=?`,
      [err.message, logId]
    );
    await db.query(
      `UPDATE sync_settings SET last_sync_status='failed', last_sync_error=? WHERE id=1`,
      [err.message]
    );
    return { status: 'failed', error: err.message };
  } finally {
    if (remoteConn) await remoteConn.end().catch(() => {});
  }
}

/* ── Mark all existing rows as unsynced (force full resync) ── */
async function resetSyncFlags() {
  for (const table of SYNC_TABLES) {
    try {
      const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'is_sync'`);
      if (cols.length) {
        const [r] = await db.query(`UPDATE \`${table}\` SET is_sync = 0`);
        logger.info(`sync reset: ${table} — ${r.affectedRows} rows flagged`);
      }
    } catch (err) {
      logger.warn(`sync reset: ${table} — ${err.message}`);
    }
  }
}

/* ── Get sync status summary ── */
async function getSyncStatus() {
  const cfg = await getSyncSettings();
  const [[logRow]] = await db.query(
    'SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 1'
  );

  // Count unsynced rows across all tables
  const pendingCounts = {};
  let totalPending = 0;
  for (const table of SYNC_TABLES) {
    try {
      const [[{ n }]] = await db.query(
        `SELECT COUNT(*) AS n FROM \`${table}\` WHERE is_sync = 0`
      );
      if (n > 0) { pendingCounts[table] = n; totalPending += n; }
    } catch (_) {}
  }

  return {
    enabled:       cfg?.sync_enabled || false,
    configured:    !!(cfg?.remote_host && cfg?.remote_user && cfg?.remote_database),
    remoteHost:    cfg?.remote_host   || null,
    remoteDB:      cfg?.remote_database || null,
    interval:      cfg?.sync_interval || 30,
    lastSynced:    cfg?.last_synced_at || null,
    lastStatus:    cfg?.last_sync_status || 'never',
    lastError:     cfg?.last_sync_error || null,
    totalPending,
    pendingCounts,
    lastLog:       logRow || null,
  };
}

module.exports = { runSync, resetSyncFlags, getSyncStatus, getSyncSettings, SYNC_TABLES };
