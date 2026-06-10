const db     = require('../config/db');
const { ok, serverErr, paginate, notFound } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  const { search, role } = req.query;
  const cond = []; const vals = [];
  if (search) { cond.push('(name LIKE ? OR email LIKE ?)'); vals.push(`%${search}%`, `%${search}%`); }
  if (role)   { cond.push('role = ?'); vals.push(role); }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, role, is_active, is_verified, avatar, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, vals);
    return ok(res, rows, { pagination: { page, perPage, total } });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.getOne = async (req, res) => {
  try {
    const [[user]] = await db.query(
      'SELECT id, name, email, role, is_active, avatar, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) return notFound(res, 'User not found');
    const [enrollments] = await db.query(
      'SELECT e.*, c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ?', [user.id]);
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [user.id]);
    return ok(res, { ...user, enrollments, payments });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.updateRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin','student'].includes(role)) return ok(res, { message: 'Invalid role' });
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    return ok(res, { message: `User role set to ${role}` });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.toggleActive = async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Status toggled' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.create = async (req, res) => ok(res, {});
exports.update = exports.updateRole;
exports.remove = exports.toggleActive;
