const db = require('../config/db');
const { ok, created, badReq, notFound, forbidden, serverErr } = require('../utils/helpers');
const logger = require('../utils/logger');

/* ═══════════════ ADMIN ═══════════════ */

/* GET /api/evaluations/module/:moduleId — admin: quiz + questions with answers */
exports.getByModuleAdmin = async (req, res) => {
  try {
    const [[evaluation]] = await db.query(
      'SELECT * FROM evaluations WHERE module_id = ?', [req.params.moduleId]);
    if (!evaluation) return ok(res, null);

    const [questions] = await db.query(
      'SELECT * FROM eval_questions WHERE evaluation_id = ? ORDER BY id', [evaluation.id]);
    evaluation.questions = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));
    return ok(res, evaluation);
  } catch (err) {
    logger.error('evaluations.getByModuleAdmin', { error: err.message });
    return serverErr(res);
  }
};

/* POST /api/evaluations — admin: create or replace a module quiz */
exports.upsert = async (req, res) => {
  const { module_id, title, pass_score, questions } = req.body;
  if (!module_id || !title) return badReq(res, 'module_id and title are required');
  if (!Array.isArray(questions) || !questions.length)
    return badReq(res, 'At least one question is required');

  for (const q of questions) {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2)
      return badReq(res, 'Each question needs text and at least 2 options');
    if (q.correct_index == null || q.correct_index < 0 || q.correct_index >= q.options.length)
      return badReq(res, 'Each question needs a valid correct_index');
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Replace existing quiz for this module (cascade deletes old questions)
    await conn.query('DELETE FROM evaluations WHERE module_id = ?', [module_id]);

    const [result] = await conn.query(
      'INSERT INTO evaluations (module_id, title, pass_score) VALUES (?, ?, ?)',
      [module_id, title.trim(), pass_score || 70]);
    const evalId = result.insertId;

    for (const q of questions) {
      await conn.query(
        'INSERT INTO eval_questions (evaluation_id, question, options, correct_index) VALUES (?, ?, ?, ?)',
        [evalId, q.question.trim(), JSON.stringify(q.options), q.correct_index]);
    }

    await conn.commit();
    return created(res, { id: evalId, message: 'Quiz saved' });
  } catch (err) {
    await conn.rollback();
    logger.error('evaluations.upsert', { error: err.message });
    return serverErr(res);
  } finally {
    conn.release();
  }
};

/* DELETE /api/evaluations/:id — admin */
exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM evaluations WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Quiz deleted' });
  } catch (err) { return serverErr(res); }
};

/* ═══════════════ STUDENT ═══════════════ */

/* Helper: is the user enrolled in the course that owns this module? */
async function isEnrolled (userId, moduleId) {
  const [[row]] = await db.query(
    `SELECT e.id FROM enrollments e
     JOIN modules m ON m.course_id = e.course_id
     WHERE e.user_id = ? AND m.id = ?`, [userId, moduleId]);
  return !!row;
}

/* GET /api/evaluations/take/:moduleId — student: quiz WITHOUT correct answers */
exports.getForStudent = async (req, res) => {
  try {
    if (!(await isEnrolled(req.user.id, req.params.moduleId)))
      return forbidden(res, 'You are not enrolled in this course');

    const [[evaluation]] = await db.query(
      'SELECT id, module_id, title, pass_score FROM evaluations WHERE module_id = ?',
      [req.params.moduleId]);
    if (!evaluation) return ok(res, null);

    const [questions] = await db.query(
      'SELECT id, question, options FROM eval_questions WHERE evaluation_id = ? ORDER BY id',
      [evaluation.id]);
    evaluation.questions = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    // Best previous attempt
    const [[best]] = await db.query(
      `SELECT MAX(score) AS best_score, MAX(passed) AS has_passed
       FROM eval_attempts WHERE user_id = ? AND evaluation_id = ?`,
      [req.user.id, evaluation.id]);
    evaluation.best_score = best?.best_score ?? null;
    evaluation.has_passed = !!best?.has_passed;

    return ok(res, evaluation);
  } catch (err) {
    logger.error('evaluations.getForStudent', { error: err.message });
    return serverErr(res);
  }
};

/* POST /api/evaluations/:id/submit — student: grade answers server-side */
exports.submit = async (req, res) => {
  const { answers } = req.body;  // { [questionId]: selectedIndex }
  if (!answers || typeof answers !== 'object')
    return badReq(res, 'answers object is required');

  try {
    const [[evaluation]] = await db.query(
      'SELECT * FROM evaluations WHERE id = ?', [req.params.id]);
    if (!evaluation) return notFound(res, 'Quiz not found');

    if (!(await isEnrolled(req.user.id, evaluation.module_id)))
      return forbidden(res, 'You are not enrolled in this course');

    const [questions] = await db.query(
      'SELECT id, correct_index FROM eval_questions WHERE evaluation_id = ?',
      [evaluation.id]);
    if (!questions.length) return badReq(res, 'Quiz has no questions');

    let correct = 0;
    const results = questions.map(q => {
      const given = answers[q.id];
      const isCorrect = given != null && Number(given) === q.correct_index;
      if (isCorrect) correct++;
      return { question_id: q.id, correct: isCorrect, correct_index: q.correct_index };
    });

    const score  = Math.round((correct / questions.length) * 100);
    const passed = score >= evaluation.pass_score ? 1 : 0;

    await db.query(
      'INSERT INTO eval_attempts (user_id, evaluation_id, score, passed) VALUES (?, ?, ?, ?)',
      [req.user.id, evaluation.id, score, passed]);

    return ok(res, {
      score,
      passed: !!passed,
      pass_score: evaluation.pass_score,
      correct_count: correct,
      total: questions.length,
      results
    });
  } catch (err) {
    logger.error('evaluations.submit', { error: err.message });
    return serverErr(res);
  }
};

/* GET /api/evaluations/:id/attempts — student: own attempt history */
exports.myAttempts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT score, passed, attempted_at FROM eval_attempts
       WHERE user_id = ? AND evaluation_id = ?
       ORDER BY attempted_at DESC LIMIT 10`,
      [req.user.id, req.params.id]);
    return ok(res, rows);
  } catch (err) { return serverErr(res); }
};
