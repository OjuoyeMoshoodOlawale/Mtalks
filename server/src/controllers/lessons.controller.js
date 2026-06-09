const db     = require('../config/db');
const { ok, created, badReq, serverErr } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  const { module_id } = req.query;
  if (!module_id) return badReq(res, 'module_id required');
  try {
    const [rows] = await db.query(
      'SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order ASC', [module_id]);
    return ok(res, rows);
  } catch (err) { return serverErr(res); }
};

exports.getOne = async (req, res) => {
  try {
    const [[lesson]] = await db.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    if (!lesson) return ok(res, null);
    // Only enrolled students or admins can access drive_file_id
    if (req.user?.role !== 'admin') {
      const [[enrol]] = await db.query(
        `SELECT e.id FROM enrollments e
         JOIN modules m ON m.course_id = e.course_id
         WHERE e.user_id = ? AND m.id = ?`,
        [req.user.id, lesson.module_id]);
      if (!enrol) { delete lesson.drive_file_id; delete lesson.content; }
    }
    return ok(res, lesson);
  } catch (err) { return serverErr(res); }
};

exports.create = async (req, res) => {
  const { module_id, title, drive_file_id, content, duration_min } = req.body;
  if (!module_id || !title) return badReq(res, 'module_id and title required');
  try {
    const [[{ maxOrder }]] = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM lessons WHERE module_id = ?', [module_id]);
    const [result] = await db.query(
      'INSERT INTO lessons (module_id, title, drive_file_id, content, duration_min, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [module_id, title.trim(), drive_file_id || null, content || null, duration_min || 0, maxOrder + 1]);
    return created(res, { id: result.insertId });
  } catch (err) {
    logger.error('lessons.create', { error: err.message });
    return serverErr(res);
  }
};

exports.update = async (req, res) => {
  const allowed = ['title','drive_file_id','content','duration_min'];
  const updates = []; const vals = [];
  for (const k of allowed) {
    if (k in req.body) { updates.push(`${k} = ?`); vals.push(req.body[k]); }
  }
  if (!updates.length) return badReq(res, 'Nothing to update');
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`, vals);
    return ok(res, { message: 'Lesson updated' });
  } catch (err) { return serverErr(res); }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Lesson deleted' });
  } catch (err) { return serverErr(res); }
};

exports.reorder = async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return badReq(res, 'order array required');
  try {
    for (const { id, sort_order } of order) {
      await db.query('UPDATE lessons SET sort_order = ? WHERE id = ?', [sort_order, id]);
    }
    return ok(res, { message: 'Reordered' });
  } catch (err) { return serverErr(res); }
};

exports.complete = async (req, res) => {
  try {
    await db.query(
      'INSERT IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)',
      [req.user.id, req.params.id]);
    return ok(res, { message: 'Progress saved' });
  } catch (err) { return serverErr(res); }
};

exports.getProgress = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT lesson_id FROM lesson_progress WHERE user_id = ?', [req.user.id]);
    return ok(res, rows.map(r => r.lesson_id));
  } catch (err) { return serverErr(res); }
};
