const db     = require('../config/db');
const { ok, serverErr } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT er.*, u.name AS student_name, u.email AS student_email,
         ev.title AS event_title, ep.name AS package_name
       FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       JOIN events ev ON ev.id = er.event_id
       JOIN event_packages ep ON ep.id = er.package_id
       ORDER BY er.registered_at DESC`);
    return ok(res, rows);
  } catch (err) { return serverErr(res); }
};

exports.getMine = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT er.*, ev.title, ev.banner, ev.type, ev.venue, ev.meeting_link, ev.event_date,
         ep.name AS package_name, ep.price
       FROM event_registrations er
       JOIN events ev ON ev.id = er.event_id
       JOIN event_packages ep ON ep.id = er.package_id
       WHERE er.user_id = ? ORDER BY er.registered_at DESC`,
      [req.user.id]);
    return ok(res, rows);
  } catch (err) { return serverErr(res); }
};

exports.create  = async (req, res) => ok(res, { message: 'Use payments/initialize for paid events' });
exports.update  = async (req, res) => ok(res, { message: 'Updated' });
exports.remove  = async (req, res) => ok(res, { message: 'Removed' });
