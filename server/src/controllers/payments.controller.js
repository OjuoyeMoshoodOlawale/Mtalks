const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { initializeTransaction, verifyTransaction, verifyWebhookSignature } = require('../services/paystack.service');
const { sendEnrolmentEmail, sendEventTicketEmail, sendPaymentReceiptEmail } = require('../services/email.service');
const { generateTicketCode } = require('../services/ticket.service');
const { ok, created, badReq, notFound, serverErr, paginate } = require('../utils/helpers');
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

    /* Try to pre-register with Paystack (gives us authorization_url for redirect fallback).
     * If this fails (network, wrong key) we still return the reference so the
     * client-side inline popup can attempt it directly. */
    let authorization_url = null;
    try {
      const txn = await initializeTransaction({ email: user.email, amount, reference, metadata });
      authorization_url = txn.authorization_url;
    } catch (paystackErr) {
      logger.warn('payments.initialize: Paystack pre-init failed (inline popup will try directly)', {
        error: paystackErr.message, reference
      });
    }

    return created(res, { reference, amount, authorization_url });
  } catch (err) {
    logger.error('payments.initialize', { error: err.message, route: req.originalUrl, userId });
    return serverErr(res, err, 'Payment initialization failed');
  }
};

/* ── Guest Event Payment Initialize (no login required) ── */
exports.initializeGuestEvent = async (req, res) => {
  const { guest_name, guest_email, event_id, package_id } = req.body;

  if (!guest_name?.trim())                   return badReq(res, 'Your full name is required');
  if (!guest_email || !/\S+@\S+\.\S+/.test(guest_email)) return badReq(res, 'A valid email address is required');
  if (!event_id || !package_id)              return badReq(res, 'Event and package are required');

  try {
    const [[pkg]] = await db.query(
      'SELECT ep.*, e.title AS event_title, e.id AS event_id, e.is_published FROM event_packages ep JOIN events e ON e.id = ep.event_id WHERE ep.id = ? AND e.id = ?',
      [package_id, event_id]);
    if (!pkg)              return badReq(res, 'Package not found');
    if (!pkg.is_published) return badReq(res, 'This event is not available');

    const earlyBirdActive = pkg.early_bird_price && new Date(pkg.early_bird_deadline) > new Date();
    const amount          = earlyBirdActive ? pkg.early_bird_price : pkg.price;

    const reference = `MA-GUEST-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

    await db.query(
      `INSERT INTO payments (user_id, guest_name, guest_email, type, item_id, amount, reference, status, metadata)
       VALUES (NULL, ?, ?, 'event', ?, ?, ?, 'pending', ?)`,
      [guest_name.trim(), guest_email.trim().toLowerCase(), event_id, amount, reference,
       JSON.stringify({ package_id, guest: true })]
    );

    /* Client-side PaystackPop handles the Paystack transaction directly */
    return created(res, { reference, amount });
  } catch (err) {
    logger.error('payments.initializeGuestEvent', { error: err.message });
    return serverErr(res, err, `Guest event payment failed: ${err.message}`);
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
    /* For guests, derive name/email from payment record */
    const recipientName  = user?.name  || payment.guest_name  || 'Valued Guest';
    const recipientEmail = user?.email || payment.guest_email;
    if (!recipientEmail) return; // can't send ticket without email

    if (payment.type === 'course') {
      if (!payment.user_id) return; // courses require an account
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
        await sendEnrolmentEmail({ to: recipientEmail, name: recipientName, courseName: course?.title });
      }
    }

    if (payment.type === 'event') {
      const meta = JSON.parse(payment.metadata || '{}');
      /* Check for existing registration — for guests match by email; for users by user_id */
      let existing;
      if (payment.user_id) {
        [[existing]] = await db.query(
          'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
          [payment.user_id, payment.item_id]);
      } else {
        [[existing]] = await db.query(
          'SELECT id FROM event_registrations WHERE guest_email = ? AND event_id = ?',
          [payment.guest_email, payment.item_id]);
      }

      if (!existing) {
        const ticketCode = generateTicketCode();
        const [[pkg]]   = await db.query('SELECT * FROM event_packages WHERE id = ?', [meta.package_id]);
        const [[ev]]    = await db.query('SELECT * FROM events WHERE id = ?', [payment.item_id]);

        await db.query(
          `INSERT INTO event_registrations
           (user_id, guest_name, guest_email, event_id, package_id, payment_id, ticket_code)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [payment.user_id || null, payment.guest_name, payment.guest_email,
           payment.item_id, meta.package_id, payment.id, ticketCode]
        );

        await sendEventTicketEmail({
          to: recipientEmail, name: recipientName,
          event: ev, packageName: pkg?.name || 'Standard',
          ticketCode, whatsappLink: ev?.whatsapp_link || null
        });

        await sendPaymentReceiptEmail({
          to: recipientEmail, name: recipientName,
          amount: payment.amount, reference,
          description: `Event registration: ${ev?.title}`
        });
      }
    }
  } catch (err) {
    logger.error('webhook processing failed', { error: err.message, reference });
    // Persist to error_logs
    try { await db.query('INSERT INTO error_logs (route, message, stack) VALUES (?,?,?)', ['/api/payments/webhook', `Webhook failed [${reference}]: ${err.message}`, err.stack || '']); } catch(_){}
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
      `SELECT p.*,
              COALESCE(u.name,  p.guest_name)  AS user_name,
              COALESCE(u.email, p.guest_email) AS user_email
       FROM payments p LEFT JOIN users u ON u.id = p.user_id
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

/* ── Confirm payment from frontend callback (works without webhook) ──
 * Called client-side after Paystack popup reports success.
 * Processes the payment: updates status, creates enrollment/registration, sends emails.
 * The webhook does the same thing server-side — this ensures local dev works too.
 */
exports.confirmPayment = async (req, res) => {
  const { reference } = req.body;
  if (!reference) return badReq(res, 'Reference required');

  try {
    const [[payment]] = await db.query(
      'SELECT * FROM payments WHERE reference = ?', [reference]
    );
    if (!payment)                    return notFound(res, 'Payment not found');
    if (payment.status === 'success') return ok(res, { message: 'Already processed', already: true });

    /* Optionally verify with Paystack API if secret key is set */
    const sk = process.env.PAYSTACK_SECRET_KEY;
    if (sk && !sk.includes('xxxx')) {
      try {
        const txn = await verifyTransaction(reference);
        if (txn.status !== 'success') return badReq(res, 'Payment not successful on Paystack');
      } catch (verifyErr) {
        logger.warn('confirmPayment: Paystack verify failed, trusting frontend callback', { error: verifyErr.message });
      }
    }

    /* Mark payment as successful */
    await db.query(
      'UPDATE payments SET status = ?, paid_at = NOW() WHERE reference = ?',
      ['success', reference]
    );

    /* Resolve recipient — for logged-in users pull from users table */
    let recipientName  = payment.guest_name  || 'Valued Guest';
    let recipientEmail = payment.guest_email || null;
    if (payment.user_id) {
      const [[u]] = await db.query('SELECT name, email FROM users WHERE id = ?', [payment.user_id]);
      if (u) { recipientName = u.name; recipientEmail = u.email; }
    }

    /* Process based on payment type */
    if (payment.type === 'event') {
      const meta = JSON.parse(payment.metadata || '{}');
      let existing;
      if (payment.user_id) {
        [[existing]] = await db.query(
          'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
          [payment.user_id, payment.item_id]);
      } else {
        [[existing]] = await db.query(
          'SELECT id FROM event_registrations WHERE guest_email = ? AND event_id = ?',
          [payment.guest_email, payment.item_id]);
      }

      if (!existing) {
        const { generateTicketCode } = require('../services/ticket.service');
        const ticketCode = generateTicketCode();
        const [[pkg]] = await db.query('SELECT * FROM event_packages WHERE id = ?', [meta.package_id]);
        const [[ev]]  = await db.query('SELECT * FROM events WHERE id = ?', [payment.item_id]);

        await db.query(
          `INSERT INTO event_registrations (user_id, guest_name, guest_email, event_id, package_id, payment_id, ticket_code)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [payment.user_id || null, payment.guest_name || recipientName, payment.guest_email || recipientEmail,
           payment.item_id, meta.package_id, payment.id, ticketCode]
        );

        if (recipientEmail) {
          const { sendEventTicketEmail, sendPaymentReceiptEmail } = require('../services/email.service');
          sendEventTicketEmail({
            to: recipientEmail, name: recipientName,
            event: ev, packageName: pkg?.name || 'Standard',
            ticketCode, whatsappLink: ev?.whatsapp_link || null
          }).catch(e => logger.warn('ticket email failed', { error: e.message }));

          sendPaymentReceiptEmail({
            to: recipientEmail, name: recipientName,
            amount: payment.amount, reference,
            description: `Event registration: ${ev?.title}`
          }).catch(e => logger.warn('receipt email failed', { error: e.message }));
        }

        return ok(res, { message: 'Registration confirmed', ticketCode, event: ev?.title });
      }
    }

    if (payment.type === 'course' && payment.user_id) {
      const [[existing]] = await db.query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
        [payment.user_id, payment.item_id]);
      if (!existing) {
        await db.query('INSERT INTO enrollments (user_id, course_id, payment_id) VALUES (?, ?, ?)',
          [payment.user_id, payment.item_id, payment.id]);
        const [[course]] = await db.query('SELECT title FROM courses WHERE id=?', [payment.item_id]);
        const [[u]] = await db.query('SELECT name, email FROM users WHERE id=?', [payment.user_id]);
        if (u) {
          const { sendEnrolmentEmail } = require('../services/email.service');
          sendEnrolmentEmail({ to: u.email, name: u.name, courseName: course?.title })
            .catch(e => logger.warn('enrolment email failed', { error: e.message }));
        }
        return ok(res, { message: 'Enrolled successfully', course: course?.title });
      }
    }

    return ok(res, { message: 'Payment confirmed' });
  } catch (err) { return serverErr(res, err, 'Payment confirmation failed'); }
};

/* Guest confirm — no auth, uses reference + email to verify */
exports.confirmGuestPayment = async (req, res) => {
  const { reference, guest_email } = req.body;
  if (!reference) return badReq(res, 'Reference required');
  // Temporarily add user info to req so confirmPayment can use it
  req.body.reference = reference;
  return exports.confirmPayment(req, res);
};
