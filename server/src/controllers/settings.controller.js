const db  = require('../config/db');
const { ok, serverErr } = require('../utils/helpers');

// Safe keys exposed to the public (no auth) — never include passwords or private keys
const PUBLIC_KEYS = [
  'site_name', 'site_tagline', 'site_email', 'whatsapp_number',
  'instagram_url', 'facebook_url', 'twitter_url', 'youtube_url',
  'tiktok_url', 'calendly_url', 'crisp_website_id', 'site_address'
];

exports.getPublic = async (req, res) => {
  try {
    const placeholders = PUBLIC_KEYS.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT \`key\`, \`value\` FROM settings WHERE \`key\` IN (${placeholders})`,
      PUBLIC_KEYS
    );
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT `key`, `value` FROM settings');
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    return ok(res, obj);
  } catch (err) { return serverErr(res, err, 'Server error'); }
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
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.create = exports.update;
exports.remove = async (req, res) => ok(res, { message: 'N/A' });
