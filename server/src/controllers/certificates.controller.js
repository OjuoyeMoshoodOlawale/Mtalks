const db = require('../config/db');
const { ok, created, badReq, notFound, serverErr } = require('../utils/helpers');
const logger = require('../utils/logger');

/* Generate a short readable certificate code: MA-XXXX-XXXX */
const genCertCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () => Array.from({ length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `MA-${block()}-${block()}`;
};

/* POST /api/certificates/claim — student: requires 100% lesson completion */
exports.claim = async (req, res) => {
  const { course_id } = req.body;
  if (!course_id) return badReq(res, 'course_id is required');

  try {
    // Must be enrolled
    const [[enrol]] = await db.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
      [req.user.id, course_id]);
    if (!enrol) return badReq(res, 'You are not enrolled in this course');

    // Completion check: all lessons in the course must be in lesson_progress
    const [[counts]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = ?) AS total,
        (SELECT COUNT(*) FROM lesson_progress lp
         JOIN lessons l ON l.id = lp.lesson_id
         JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = ? AND lp.user_id = ?) AS done`,
      [course_id, course_id, req.user.id]);

    if (!counts.total) return badReq(res, 'This course has no lessons yet');
    if (counts.done < counts.total)
      return badReq(res, `Complete all lessons first (${counts.done}/${counts.total} done)`);

    // Already claimed? Return existing
    const [[existing]] = await db.query(
      'SELECT cert_code, issued_at FROM certificates WHERE user_id = ? AND course_id = ?',
      [req.user.id, course_id]);
    if (existing) return ok(res, existing);

    // Issue new (retry once on rare code collision)
    let code = genCertCode();
    try {
      await db.query(
        'INSERT INTO certificates (user_id, course_id, cert_code) VALUES (?, ?, ?)',
        [req.user.id, course_id, code]);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        code = genCertCode();
        await db.query(
          'INSERT INTO certificates (user_id, course_id, cert_code) VALUES (?, ?, ?)',
          [req.user.id, course_id, code]);
      } else throw e;
    }

    return created(res, { cert_code: code, issued_at: new Date() });
  } catch (err) {
    logger.error('certificates.claim', { error: err.message });
    return serverErr(res);
  }
};

/* GET /api/certificates/my — student's certificates */
exports.getMine = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.cert_code, c.issued_at, co.title AS course_title, co.slug
       FROM certificates c JOIN courses co ON co.id = c.course_id
       WHERE c.user_id = ? ORDER BY c.issued_at DESC`,
      [req.user.id]);
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* GET /api/certificates/verify/:code — PUBLIC verification */
exports.verify = async (req, res) => {
  try {
    const [[cert]] = await db.query(
      `SELECT c.cert_code, c.issued_at, u.name AS student_name, co.title AS course_title
       FROM certificates c
       JOIN users u   ON u.id = c.user_id
       JOIN courses co ON co.id = c.course_id
       WHERE c.cert_code = ?`,
      [req.params.code.toUpperCase()]);
    if (!cert) return notFound(res, 'Certificate not found — this code is not valid');
    return ok(res, cert);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};
