const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { initializeTransaction, verifyTransaction, verifyWebhookSignature } = require('../services/paystack.service');
const { sendEnrolmentEmail, sendEventTicketEmail, sendPaymentReceiptEmail } = require('../services/email.service');
const { generateTicketCode } = require('../services/ticket.service');
const { ok, created, badReq, serverErr, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

/* ── Initialize payment ── */
exports.initialize = async (req, res) => {
  const { type, item_id } = req.body;
  const userId = req.user.id;

  try {
    const [[user]] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);

    let amount, description, metadata = {};

    if (type === 'course') {
      const [[course]] = await db.query('SELECT id, title, price, is_free FROM courses WHERE id = ?', [item_id]);
      if (!course) return badReq(res, 'Course not found');
      if (course.is_free || course.price === 0) return badReq(res, 'This course is free. No payment needed.');
      const [[existing]] = await db.query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, item_id]
      );
      if (existing) return badReq(res, 'You are already enrolled in this course');
      amount = course.price;
      description = `Course: ${course.title}`;
      metadata = { course_id: course.id, course_title: course.title };
    }

    if (type === 'event') {
      const { package_id } = req.body;
      const [[pkg]] = await db.query('SELECT * FROM event_packages WHERE id = ?', [package_id]);
      if (!pkg) return badReq(res, 'Package not found');

      const now = new Date();
      const isEarlyBird = pkg.early_bird_price && pkg.early_bird_deadline && new Date(pkg.early_bird_deadline) > now;
      amount = isEarlyBird ? pkg.early_bird_price : pkg.price;

      const [[event]] = await db.query('SELECT id, title, deadline FROM events WHERE id = ?', [item_id]);
      if (!event) return badReq(res, 'Event not found');
      if (new Date(event.deadline) < now) return badReq(res, 'Registration deadline has passed');

      description = `Event: ${event.title} — ${pkg.name}`;
      metadata = { event_id: event.id, package_id: pkg.id, package_name: pkg.name };
    }

    const reference = `MTK-${type.toUpperCase()}-${uuidv4().split('-')[0].toUpperCase()}`;

    await db.query(
      'INSERT INTO payments (user_id, type, item_id, amount, reference, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, item_id, amount, reference, JSON.stringify(metadata)]
    );

    const txn = await initializeTransaction({
      email: user.email,
      amount,
      reference,
      metadata: { ...metadata, user_id: userId, user_name: user.name }
    });

    return created(res, { authorization_url: txn.authorization_url, reference, amount });
  } catch (err) {
    logger.error('payments.initialize', { error: err.message, route: req.originalUrl, userId });
    return serverErr(res);
  }
};

/* ── Paystack Webhook ── */
exports.webhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = JSON.parse(req.body.toString());
  res.status(200).send('OK'); // Respond to Paystack immediately

  if (event.event !== 'charge.success') return;

  const { reference } = event.data;

  try {
    const txn = await verifyTransaction(reference);
    if (txn.status !== 'success') return;

    const [[payment]] = await db.query(
      'SELECT * FROM payments WHERE reference = ?', [reference]
    );
    if (!payment || payment.status === 'success') return;

    await db.query(
      'UPDATE payments SET status = ?, paid_at = NOW() WHERE reference = ?',
      ['success', reference]
    );

    const [[user]] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [payment.user_id]);

    if (payment.type === 'course') {
      const [[existing]] = await db.query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
        [payment.user_id, payment.item_id]
      );
      if (!existing) {
        await db.query(
          'INSERT INTO enrollments (user_id, course_id, payment_id) VALUES (?, ?, ?)',
          [payment.user_id, payment.item_id, payment.id]
        );
        const [[course]] = await db.query('SELECT title FROM courses WHERE id = ?', [payment.item_id]);
        await sendEnrolmentEmail({ to: user.email, name: user.name, courseName: course?.title });
      }
    }

    if (payment.type === 'event') {
      const meta = JSON.parse(payment.metadata || '{}');
      const [[existing]] = await db.query(
        'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
        [payment.user_id, payment.item_id]
      );
      if (!existing) {
        const ticketCode = generateTicketCode();
        const [[pkg]]   = await db.query('SELECT * FROM event_packages WHERE id = ?', [meta.package_id]);
        const [[ev]]    = await db.query('SELECT * FROM events WHERE id = ?', [payment.item_id]);

        await db.query(
          'INSERT INTO event_registrations (user_id, event_id, package_id, payment_id, ticket_code) VALUES (?, ?, ?, ?, ?)',
          [payment.user_id, payment.item_id, meta.package_id, payment.id, ticketCode]
        );

        await sendEventTicketEmail({
          to: user.email, name: user.name,
          event: ev, packageName: pkg?.name || 'Standard',
          ticketCode, whatsappLink: ev?.whatsapp_link || null
        });

        await sendPaymentReceiptEmail({
          to: user.email, name: user.name,
          amount: payment.amount, reference,
          description: `Event registration: ${ev?.title}`
        });
      }
    }
  } catch (err) {
    logger.error('webhook processing failed', { error: err.message, reference });
  }
};

/* ── Admin: all payments ── */
exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  const { type, status } = req.query;
  const conditions = [];
  const vals = [];
  if (type)   { conditions.push('p.type = ?');   vals.push(type); }
  if (status) { conditions.push('p.status = ?'); vals.push(status); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email
       FROM payments p JOIN users u ON u.id = p.user_id
       ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM payments p ${where}`, vals);
    return ok(res, rows, { pagination: { page, perPage, total } });
  } catch (err) {
    logger.error('payments.getAll', { error: err.message });
    return serverErr(res);
  }
};

exports.getMine = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return ok(res, rows);
  } catch (err) { return serverErr(res, err, 'Server error');
  }
};
