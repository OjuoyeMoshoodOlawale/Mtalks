const db     = require('../config/db');
const { ok, created, badReq, serverErr } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const where = req.user?.role === 'admin' ? '' : 'WHERE is_published = 1';
  try {
    const [rows] = await db.query(`SELECT * FROM faqs ${where} ORDER BY sort_order ASC, id ASC`);
    return ok(res, rows);
  } catch (err) { return serverErr(res); }
};

exports.create = async (req, res) => {
  const { question, answer, category } = req.body;
  if (!question || !answer) return badReq(res, 'Question and answer required');
  try {
    const [r] = await db.query(
      'INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)',
      [question.trim(), answer.trim(), category || 'General']);
    return created(res, { id: r.insertId });
  } catch (err) { return serverErr(res); }
};

exports.update = async (req, res) => {
  const allowed = ['question','answer','category','sort_order','is_published'];
  const updates = []; const vals = [];
  for (const k of allowed) { if (k in req.body) { updates.push(`${k} = ?`); vals.push(req.body[k]); } }
  if (!updates.length) return badReq(res, 'Nothing to update');
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE faqs SET ${updates.join(', ')} WHERE id = ?`, vals);
    return ok(res, { message: 'Updated' });
  } catch (err) { return serverErr(res); }
};

exports.remove = async (req, res) => {
  try { await db.query('DELETE FROM faqs WHERE id = ?', [req.params.id]); return ok(res, { message: 'Deleted' }); }
  catch (err) { return serverErr(res); }
};
