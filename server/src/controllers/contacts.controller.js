const db     = require('../config/db');
const { ok, badReq, serverErr } = require('../utils/helpers');
const { sendContactNotification } = require('../services/email.service');
const logger = require('../utils/logger');

/* POST /api/contacts — public */
exports.submit = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message)
    return badReq(res, 'All fields are required');

  try {
    await db.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]
    );

    // Notify admin by email (non-blocking)
    sendContactNotification({ name, email, subject, message }).catch(() => {});

    return ok(res, { message: 'Message received. We will be in touch soon!' });
  } catch (err) {
    logger.error('contacts.submit error', { error: err.message });
    return serverErr(res);
  }
};

/* GET /api/contacts — admin only */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* PATCH /api/contacts/:id/read — admin only */
exports.markRead = async (req, res) => {
  try {
    await db.query('UPDATE contacts SET is_read = 1 WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Marked as read' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* DELETE /api/contacts/:id — admin only */
exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Deleted' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* GET /api/contacts/unread-count — admin only */
exports.unreadCount = async (req, res) => {
  try {
    const [[row]] = await db.query('SELECT COUNT(*) AS count FROM contacts WHERE is_read = 0');
    return ok(res, { count: row.count });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};
