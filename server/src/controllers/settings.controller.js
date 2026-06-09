const db  = require('../config/db');
const { ok, serverErr } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT `key`, `value` FROM settings');
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    return ok(res, obj);
  } catch (err) { return serverErr(res); }
};

exports.update = async (req, res) => {
  const entries = Object.entries(req.body);
  if (!entries.length) return ok(res, { message: 'Nothing to update' });
  try {
    for (const [key, value] of entries) {
      await db.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [key, value, value]);
    }
    return ok(res, { message: 'Settings saved' });
  } catch (err) { return serverErr(res); }
};

exports.create = exports.update;
exports.remove = async (req, res) => ok(res, { message: 'N/A' });
