const db = require('../config/db');
const { ok, badReq, serverErr } = require('../utils/helpers');
const logger = require('../utils/logger');

/* ── Matching engine ──
 * Scores each knowledge entry by how many of its keywords appear in the
 * user's message. FAQs are also searched as a secondary knowledge source.
 */
function scoreEntry (message, keywords) {
  const msg = ` ${message.toLowerCase()} `;
  let score = 0;
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (!k) continue;
    if (msg.includes(k)) score += k.split(' ').length; // multi-word keywords score higher
  }
  return score;
}

/* POST /api/bot/ask — public */
exports.ask = async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return badReq(res, 'message is required');
  const text = message.trim().slice(0, 500);

  try {
    // 1. Knowledge base
    const [knowledge] = await db.query(
      'SELECT topic, keywords, answer FROM bot_knowledge WHERE is_active = 1');

    let best = null, bestScore = 0;
    for (const k of knowledge) {
      const s = scoreEntry(text, k.keywords.split(','));
      if (s > bestScore) { bestScore = s; best = k; }
    }

    if (best && bestScore > 0) {
      return ok(res, { answer: best.answer, topic: best.topic, source: 'knowledge' });
    }

    // 2. FAQ fallback — match words in question text
    const [faqs] = await db.query(
      'SELECT question, answer FROM faqs WHERE is_published = 1');
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);

    let bestFaq = null, bestFaqScore = 0;
    for (const f of faqs) {
      const q = f.question.toLowerCase();
      const s = words.filter(w => q.includes(w)).length;
      if (s > bestFaqScore) { bestFaqScore = s; bestFaq = f; }
    }

    if (bestFaq && bestFaqScore >= 2) {
      return ok(res, { answer: bestFaq.answer, topic: bestFaq.question, source: 'faq' });
    }

    // 3. Default fallback
    return ok(res, {
      answer: "I'm not sure about that one yet! 🤲 You can ask me about our courses, events, consultations, payments, or certificates. For anything else, please use the Contact page and our team will respond personally.",
      topic: null,
      source: 'fallback'
    });
  } catch (err) {
    logger.error('bot.ask', { error: err.message });
    return serverErr(res);
  }
};

/* ── Admin knowledge CRUD ── */

/* GET /api/bot/knowledge */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bot_knowledge ORDER BY topic');
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* POST /api/bot/knowledge */
exports.create = async (req, res) => {
  const { topic, keywords, answer } = req.body;
  if (!topic || !keywords || !answer)
    return badReq(res, 'topic, keywords, and answer are required');
  try {
    const [r] = await db.query(
      'INSERT INTO bot_knowledge (topic, keywords, answer) VALUES (?, ?, ?)',
      [topic.trim(), keywords.trim(), answer.trim()]);
    return ok(res, { id: r.insertId, message: 'Knowledge added' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* PUT /api/bot/knowledge/:id */
exports.update = async (req, res) => {
  const { topic, keywords, answer, is_active } = req.body;
  try {
    await db.query(
      'UPDATE bot_knowledge SET topic = ?, keywords = ?, answer = ?, is_active = ? WHERE id = ?',
      [topic, keywords, answer, is_active ? 1 : 0, req.params.id]);
    return ok(res, { message: 'Knowledge updated' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* DELETE /api/bot/knowledge/:id */
exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM bot_knowledge WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Knowledge deleted' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};
