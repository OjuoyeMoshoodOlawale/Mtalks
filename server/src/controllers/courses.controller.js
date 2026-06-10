const db      = require('../config/db');
const slugify = require('../utils/slugify');
const { ok, created, badReq, notFound, serverErr, paginate } = require('../utils/helpers');
const logger  = require('../utils/logger');

exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  try {
    const where = req.user?.role === 'admin' ? '' : 'WHERE is_published = 1';
    const [courses] = await db.query(
      `SELECT id, title, slug, description, thumbnail, price, is_free, is_published, created_at
       FROM courses ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM courses ${where}`);
    return ok(res, courses, { pagination: { page, perPage, total } });
  } catch (err) {
    logger.error('courses.getAll', { error: err.message, route: req.originalUrl });
    return serverErr(res);
  }
};

exports.getOne = async (req, res) => {
  try {
    /* Accept both numeric ID (from admin editor) and slug (from public pages) */
    const param = req.params.slug;
    const isId  = /^\d+$/.test(param);
    const [[course]] = await db.query(
      isId ? 'SELECT * FROM courses WHERE id = ?' : 'SELECT * FROM courses WHERE slug = ?',
      [param]
    );
    if (!course) return notFound(res, 'Course not found');

    const [modules] = await db.query(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order ASC',
      [course.id]
    );

    for (const mod of modules) {
      const [lessons] = await db.query(
        'SELECT id, title, duration_min, sort_order, content, transcript, supplementary_url, supplementary_label, drive_file_id, video_type FROM lessons WHERE module_id = ? ORDER BY sort_order ASC',
        [mod.id]
      );
      mod.lessons = lessons;

      const [evals] = await db.query('SELECT id, title, pass_score FROM evaluations WHERE module_id = ?', [mod.id]);
      mod.evaluation = evals[0] || null;
    }

    course.modules = modules;

    // Check if requesting user is enrolled
    if (req.user) {
      const [[enrol]] = await db.query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
        [req.user.id, course.id]
      );
      course.enrolled = !!enrol;
    }

    return ok(res, course);
  } catch (err) {
    logger.error('courses.getOne', { error: err.message, route: req.originalUrl });
    return serverErr(res);
  }
};

exports.create = async (req, res) => {
  const { title, description, thumbnail, price, is_free } = req.body;
  if (!title) return badReq(res, 'Course title is required');
  try {
    const slug = slugify(title) + '-' + Date.now().toString(36);
    const [result] = await db.query(
      'INSERT INTO courses (title, slug, description, thumbnail, price, is_free) VALUES (?, ?, ?, ?, ?, ?)',
      [title.trim(), slug, description || null, thumbnail || null, price || 0, is_free ? 1 : 0]
    );
    return created(res, { id: result.insertId, slug });
  } catch (err) {
    logger.error('courses.create', { error: err.message });
    return serverErr(res);
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const fields  = req.body;
  const allowed = ['title','description','thumbnail','price','is_free','is_published'];
  try {
    const updates = [];
    const vals    = [];
    for (const key of allowed) {
      if (key in fields) { updates.push(`${key} = ?`); vals.push(fields[key]); }
    }
    if (!updates.length) return badReq(res, 'No valid fields to update');
    vals.push(id);
    await db.query(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, vals);
    return ok(res, { message: 'Course updated' });
  } catch (err) {
    logger.error('courses.update', { error: err.message });
    return serverErr(res);
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Course deleted' });
  } catch (err) { return serverErr(res, err, 'Server error');
  }
};
