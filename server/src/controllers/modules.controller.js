const db     = require('../config/db');
const { ok, created, badReq, notFound, serverErr } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  const { course_id } = req.query;
  if (!course_id) return badReq(res, 'course_id is required');
  try {
    const [modules] = await db.query(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order ASC', [course_id]);
    for (const m of modules) {
      const [lessons] = await db.query(
        'SELECT id, title, duration_min, sort_order FROM lessons WHERE module_id = ? ORDER BY sort_order ASC', [m.id]);
      const [evals] = await db.query('SELECT id, title, pass_score FROM evaluations WHERE module_id = ?', [m.id]);
      m.lessons = lessons;
      m.evaluation = evals[0] || null;
    }
    return ok(res, modules);
  } catch (err) {
    logger.error('modules.getAll', { error: err.message, route: req.originalUrl });
    return serverErr(res);
  }
};

exports.create = async (req, res) => {
  const { course_id, title, description } = req.body;
  if (!course_id || !title) return badReq(res, 'course_id and title are required');
  try {
    const [[{ maxOrder }]] = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM modules WHERE course_id = ?', [course_id]);
    const [result] = await db.query(
      'INSERT INTO modules (course_id, title, description, sort_order) VALUES (?, ?, ?, ?)',
      [course_id, title.trim(), description || null, maxOrder + 1]);
    return created(res, { id: result.insertId });
  } catch (err) {
    logger.error('modules.create', { error: err.message });
    return serverErr(res);
  }
};

exports.update = async (req, res) => {
  const { title, description } = req.body;
  if (!title) return badReq(res, 'Title is required');
  try {
    await db.query('UPDATE modules SET title = ?, description = ? WHERE id = ?',
      [title.trim(), description || null, req.params.id]);
    return ok(res, { message: 'Module updated' });
  } catch (err) { return serverErr(res); }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM modules WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Module deleted' });
  } catch (err) { return serverErr(res); }
};

exports.reorder = async (req, res) => {
  const { order } = req.body; // [{id, sort_order}]
  if (!Array.isArray(order)) return badReq(res, 'order array required');
  try {
    for (const { id, sort_order } of order) {
      await db.query('UPDATE modules SET sort_order = ? WHERE id = ?', [sort_order, id]);
    }
    return ok(res, { message: 'Order saved' });
  } catch (err) { return serverErr(res); }
};
