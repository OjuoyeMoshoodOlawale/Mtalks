const db     = require('../config/db');
const { ok, created, conflict, serverErr } = require('../utils/helpers');
const { sendEnrolmentEmail } = require('../services/email.service');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, u.name AS student_name, u.email AS student_email, c.title AS course_title
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       JOIN courses c ON c.id = e.course_id
       ORDER BY e.enrolled_at DESC`);
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.getMine = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, c.title, c.thumbnail, c.slug, c.description,
         (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) AS total_modules,
         (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id) AS total_lessons,
         (SELECT COUNT(*) FROM lesson_progress lp
          JOIN lessons l ON l.id = lp.lesson_id
          JOIN modules m ON m.id = l.module_id
          WHERE m.course_id = c.id AND lp.user_id = e.user_id) AS completed_lessons
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`,
      [req.user.id]);
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

exports.create = async (req, res) => {
  const { course_id } = req.body;
  try {
    const [[existing]] = await db.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [req.user.id, course_id]);
    if (existing) return conflict(res, 'Already enrolled in this course');

    const [[course]] = await db.query('SELECT * FROM courses WHERE id = ?', [course_id]);
    if (!course) return notFound(res, 'Course not found');

    if (!course.is_free && course.price > 0)
      return ok(res, { requiresPayment: true, price: course.price });

    await db.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [req.user.id, course_id]);
    const [[user]] = await db.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
    await sendEnrolmentEmail({ to: user.email, name: user.name, courseName: course.title }).catch(() => {});
    return created(res, { message: 'Enrolled successfully' });
  } catch (err) {
    logger.error('enrollments.create', { error: err.message });
    return serverErr(res);
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM enrollments WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Enrollment removed' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};
