const db     = require('../config/db');
const { ok, created, badReq, serverErr, paginate } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  const where = req.user?.role === 'admin' ? '' : 'WHERE is_published = 1';
  try {
    const [rows] = await db.query(
      `SELECT * FROM testimonials ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM testimonials ${where}`);
    return ok(res, rows, { pagination: { page, perPage, total } });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.create = async (req, res) => {
  const { client_name, content, rating, client_photo, source } = req.body;
  if (!client_name || !content) return badReq(res, 'Name and testimonial are required');
  try {
    const [result] = await db.query(
      'INSERT INTO testimonials (client_name, content, rating, client_photo, source) VALUES (?, ?, ?, ?, ?)',
      [client_name.trim(), content.trim(), rating || 5, client_photo || null, source || 'manual']);
    return created(res, { id: result.insertId });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.update = async (req, res) => {
  const allowed = ['client_name','content','rating','client_photo','source','is_published'];
  const updates = []; const vals = [];
  for (const k of allowed) { if (k in req.body) { updates.push(`${k} = ?`); vals.push(req.body[k]); } }
  if (!updates.length) return badReq(res, 'Nothing to update');
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`, vals);
    return ok(res, { message: 'Updated' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Deleted' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};
