/**
 * Sync Controller — Muhsinah Academy Remote DB Sync
 */
const { runSync, resetSyncFlags, getSyncStatus, getSyncSettings, SYNC_TABLES } = require('../services/sync.service');
const db     = require('../config/db');
const { ok, badReq, serverErr } = require('../utils/helpers');
const logger = require('../utils/logger');

/* ── GET /api/sync/status ── */
exports.getStatus = async (req, res) => {
  try {
    const status = await getSyncStatus();
    return ok(res, status);
  } catch (err) { return serverErr(res, err, 'Could not get sync status'); }
};

/* ── GET /api/sync/settings ── */
exports.getSettings = async (req, res) => {
  try {
    const cfg = await getSyncSettings();
    if (!cfg) return ok(res, {});
    // Never expose password in response
    const { remote_password, ...safe } = cfg;
    safe.remote_password_set = !!remote_password;
    return ok(res, safe);
  } catch (err) { return serverErr(res, err, 'Could not get sync settings'); }
};

/* ── PUT /api/sync/settings ── */
exports.saveSettings = async (req, res) => {
  const {
    remote_host, remote_port, remote_user, remote_password,
    remote_database, sync_interval, sync_enabled
  } = req.body;

  if (!remote_host && sync_enabled) return badReq(res, 'Remote host is required when enabling sync');
  if (!remote_database && sync_enabled) return badReq(res, 'Remote database name is required');

  try {
    const [[existing]] = await db.query('SELECT id, remote_password FROM sync_settings WHERE id = 1');

    const password = remote_password?.trim()
      ? remote_password.trim()
      : (existing?.remote_password || ''); // keep old password if blank

    if (existing) {
      await db.query(
        `UPDATE sync_settings SET
          remote_host     = ?,
          remote_port     = ?,
          remote_user     = ?,
          remote_password = ?,
          remote_database = ?,
          sync_interval   = ?,
          sync_enabled    = ?
         WHERE id = 1`,
        [
          remote_host || '',
          parseInt(remote_port) || 3306,
          remote_user || '',
          password,
          remote_database || '',
          parseInt(sync_interval) || 30,
          sync_enabled ? 1 : 0,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO sync_settings (id, remote_host, remote_port, remote_user, remote_password, remote_database, sync_interval, sync_enabled) VALUES (1,?,?,?,?,?,?,?)`,
        [remote_host||'', parseInt(remote_port)||3306, remote_user||'', password, remote_database||'', parseInt(sync_interval)||30, sync_enabled?1:0]
      );
    }

    return ok(res, { message: 'Sync settings saved.' });
  } catch (err) { return serverErr(res, err, 'Could not save sync settings'); }
};

/* ── POST /api/sync/run — manual trigger ── */
exports.triggerSync = async (req, res) => {
  try {
    // Run in background, respond immediately
    res.json({ success: true, data: { message: 'Sync started. Check /api/sync/status for progress.' } });
    const result = await runSync();
    logger.info('Manual sync triggered', result);
  } catch (err) { logger.error('Manual sync failed', { error: err.message }); }
};

/* ── POST /api/sync/test-connection — test remote DB ── */
exports.testConnection = async (req, res) => {
  const { remote_host, remote_port, remote_user, remote_password, remote_database } = req.body;
  if (!remote_host || !remote_user || !remote_database) {
    return badReq(res, 'Host, user, and database are required');
  }
  try {
    const mysql = require('mysql2/promise');
    const conn  = await mysql.createConnection({
      host:     remote_host,
      port:     parseInt(remote_port) || 3306,
      user:     remote_user,
      password: remote_password || '',
      database: remote_database,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 8000,
    });
    await conn.query('SELECT 1');
    await conn.end();
    return ok(res, { message: `Connected to ${remote_host}/${remote_database} successfully.` });
  } catch (err) {
    return ok(res, { success: false, error: err.message, message: `Connection failed: ${err.message}` });
  }
};

/* ── POST /api/sync/reset — mark all rows is_sync=0 for full resync ── */
exports.resetSync = async (req, res) => {
  try {
    await resetSyncFlags();
    return ok(res, { message: 'All rows flagged for resync. Run a manual sync to push everything.' });
  } catch (err) { return serverErr(res, err, 'Reset failed'); }
};

/* ── GET /api/sync/logs ── */
exports.getLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 50'
    );
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Could not get sync logs'); }
};

/* ── GET /api/sync/tables — unsynced count per table ── */
exports.getTableStats = async (req, res) => {
  try {
    const stats = [];
    for (const table of SYNC_TABLES) {
      try {
        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
        const [[{ pending }]] = await db.query(`SELECT COUNT(*) AS pending FROM \`${table}\` WHERE is_sync = 0`);
        const [[{ synced }]]  = await db.query(`SELECT COUNT(*) AS synced  FROM \`${table}\` WHERE is_sync = 1`);
        stats.push({ table, total, pending, synced });
      } catch (_) {
        stats.push({ table, total: 0, pending: 0, synced: 0, note: 'is_sync column missing — run migration' });
      }
    }
    return ok(res, stats);
  } catch (err) { return serverErr(res, err, 'Could not get table stats'); }
};
