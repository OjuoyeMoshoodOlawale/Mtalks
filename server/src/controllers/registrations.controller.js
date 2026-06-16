const db     = require('../config/db');
const { ok, serverErr } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  try {
    let query = `SELECT er.*, u.name AS student_name, u.email AS student_email,
         ev.title AS event_title, ep.name AS package_name
       FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       JOIN events ev ON ev.id = er.event_id
       JOIN event_packages ep ON ep.id = er.package_id`;
    const params = [];
    if (req.query.event_id) {
      query += ' WHERE er.event_id = ?';
      params.push(req.query.event_id);
    }
    query += ' ORDER BY er.registered_at DESC';
    const [rows] = await db.query(query, params);
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.checkIn = async (req, res) => {
  try {
    const [[reg]] = await db.query('SELECT * FROM event_registrations WHERE id = ?', [req.params.id]);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (reg.attended_at) return ok(res, { message: 'Already checked in' });
    await db.query('UPDATE event_registrations SET attended_at = NOW() WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Checked in successfully' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.getMine = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT er.id, er.ticket_code, er.attended_at, er.registered_at,
         ev.title, ev.banner, ev.type, ev.venue, ev.meeting_link, ev.event_date,
         ep.name AS package_name, ep.price
       FROM event_registrations er
       JOIN events ev ON ev.id = er.event_id
       JOIN event_packages ep ON ep.id = er.package_id
       WHERE er.user_id = ? ORDER BY er.registered_at DESC`,
      [req.user.id]);

    // Generate QR codes on demand (not stored — always derived from ticket_code)
    const { generateQrDataUrl } = require('../services/ticket.service');
    for (const r of rows) {
      try { r.qr_data = await generateQrDataUrl(r.ticket_code); }
      catch { r.qr_data = null; }
    }

    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.create  = async (req, res) => ok(res, { message: 'Use payments/initialize for paid events' });
exports.update  = async (req, res) => ok(res, { message: 'Updated' });
exports.remove  = async (req, res) => ok(res, { message: 'Removed' });

/* ── Admin: export event registrations as CSV ── */
exports.exportCsv = async (req, res) => {
  const { event_id } = req.query;
  try {
    const where = event_id ? 'WHERE er.event_id = ?' : '';
    const vals  = event_id ? [event_id] : [];
    const [rows] = await db.query(
      `SELECT
         er.id, er.ticket_code, er.registered_at, er.attended_at,
         COALESCE(u.name,  er.guest_name)  AS name,
         COALESCE(u.email, er.guest_email) AS email,
         ev.title AS event_title,
         ep.name  AS package_name,
         ep.price AS package_price,
         CASE WHEN er.user_id IS NULL THEN 'Guest' ELSE 'Account' END AS type
       FROM event_registrations er
       JOIN events ev          ON ev.id = er.event_id
       JOIN event_packages ep  ON ep.id = er.package_id
       LEFT JOIN users u       ON u.id  = er.user_id
       ${where}
       ORDER BY er.registered_at DESC`,
      vals
    );

    const header = 'Name,Email,Event,Package,Price,Type,Ticket Code,Registered,Attended\n';
    const csvRows = rows.map(r => [
      `"${(r.name  || '').replace(/"/g,'""')}"`,
      `"${(r.email || '').replace(/"/g,'""')}"`,
      `"${(r.event_title   || '').replace(/"/g,'""')}"`,
      `"${(r.package_name  || '').replace(/"/g,'""')}"`,
      r.package_price || 0,
      r.type,
      r.ticket_code,
      r.registered_at ? new Date(r.registered_at).toLocaleDateString('en-NG') : '',
      r.attended_at   ? new Date(r.attended_at).toLocaleDateString('en-NG')   : 'Not yet'
    ].join(','));

    const csv = header + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="registrations-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { return serverErr(res, err, 'Export failed'); }
};
