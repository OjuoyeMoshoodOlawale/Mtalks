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
    // Return as key→value object (consistent with getAll + easier for frontend)
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    return ok(res, obj);
  } catch (err) {
    // Table may not exist yet (before first seed) — return empty object, not 500
    return ok(res, {});
  }
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

/* ── Admin: send test email ── */
exports.testEmail = async (req, res) => {
  const { to } = req.body;
  if (!to) return badReq(res, 'Email address required');
  try {
    const transporter = require('../config/mailer');
    await transporter.sendMail({
      from:    process.env.MAIL_FROM || `"Muhsinah Academy" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Muhsinah Academy — Email Test',
      html: `<div style="font-family:Arial;padding:24px;max-width:480px;margin:0 auto">
        <h2 style="color:#0D3B15">Email is working!</h2>
        <p>This is a test email from Muhsinah Academy.</p>
        <p>Sent: ${new Date().toLocaleString('en-NG')}</p>
        <p style="color:#888;font-size:12px">From: ${process.env.GMAIL_USER}</p>
      </div>`,
      text: 'Email is working! Sent from Muhsinah Academy at ' + new Date().toLocaleString('en-NG')
    });
    return ok(res, { message: 'Test email sent to ' + to + '. Check inbox AND spam folder.' });
  } catch (err) {
    return serverErr(res, err, 'Email failed: ' + err.message);
  }
};
