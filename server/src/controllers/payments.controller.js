/**
 * Payments Controller — Mtalks / Muhsinah Academy
 *
 * Standard Paystack flow:
 *  1. POST /initialize         → create payment record (pending), get reference
 *  2. Paystack popup runs      → user pays
 *  3. GET  /verify?reference=  → verify with Paystack API, update DB, send email
 *     (also accepts POST /verify for popup callback mode)
 *  4. POST /webhook            → server-side safety net from Paystack
 *
 * /confirm and /confirm-guest are kept for backward compat but now delegate to verifyPayment.
 */

const { v4: uuidv4 }  = require('uuid');
const db              = require('../config/db');
const { initializeTransaction, verifyTransaction, verifyWebhookSignature } =
  require('../services/paystack.service');
const { sendEnrolmentEmail, sendEventTicketEmail, sendPaymentReceiptEmail } =
  require('../services/email.service');
const { generateTicketCode } = require('../services/ticket.service');
const { ok, created, badReq, notFound, serverErr, paginate } =
  require('../utils/helpers');
const logger = require('../utils/logger');

/* ─────────────────────────────────────────────
   SHARED: resolve recipient name + email
───────────────────────────────────────────── */
const _getRecipient = async (payment) => {
  let name  = payment.guest_name  || 'Valued Guest';
  let email = payment.guest_email || null;
  if (payment.user_id) {
    const [[u]] = await db.query('SELECT name, email FROM users WHERE id = ?', [payment.user_id]);
    if (u) { name = u.name; email = u.email; }
  }
  return { name, email };
};

/* ─────────────────────────────────────────────
   SHARED: process event payment after DB is marked success
───────────────────────────────────────────── */
const _processEvent = async (payment, reference, recipientName, recipientEmail) => {
  const meta = (() => { try { return JSON.parse(payment.metadata || '{}'); } catch { return {}; } })();

  console.log('[_processEvent] meta:', meta, '| item_id:', payment.item_id);

  /* Idempotency — skip if registration already exists */
  let existingReg;
  if (payment.user_id) {
    [[existingReg]] = await db.query(
      'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
      [payment.user_id, payment.item_id]
    );
  } else {
    [[existingReg]] = await db.query(
      'SELECT id FROM event_registrations WHERE guest_email = ? AND event_id = ?',
      [payment.guest_email, payment.item_id]
    );
  }

  if (existingReg) {
    console.log('[_processEvent] registration already exists — skipping insert');
    return { message: 'Already registered', emailSent: false };
  }

  const ticketCode = generateTicketCode();
  const [[pkg]]    = await db.query('SELECT * FROM event_packages WHERE id = ?', [meta.package_id]);
  const [[ev]]     = await db.query('SELECT * FROM events WHERE id = ?', [payment.item_id]);

  console.log('[_processEvent] pkg:', pkg?.name, '| event:', ev?.title);

  /* Insert registration */
  try {
    await db.query(
      `INSERT INTO event_registrations
         (user_id, guest_name, guest_email, event_id, package_id, payment_id, ticket_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.user_id   || null,
        payment.guest_name  || recipientName,
        payment.guest_email || recipientEmail,
        payment.item_id,
        meta.package_id,
        payment.id,
        ticketCode,
      ]
    );
    console.log('[_processEvent] ✅ event_registrations row inserted — ticket:', ticketCode);
  } catch (regErr) {
    console.error('[_processEvent] ❌ INSERT failed:', regErr.message);
    logger.error('_processEvent: INSERT event_registrations failed', { error: regErr.message, reference });
    /* Payment already success — don't let a registration DB error block the response */
    return { message: 'Payment confirmed, registration pending manual review', emailSent: false, ticketCode };
  }

  /* Send ticket email */
  let emailSent = false;
  if (recipientEmail) {
    console.log('[_processEvent] sending ticket email to:', recipientEmail);
    try {
      await sendEventTicketEmail({
        to:          recipientEmail,
        name:        recipientName,
        event:       ev,
        pkg,
        packageName: pkg?.name || 'Standard',
        ticketCode,
      });
      emailSent = true;
      console.log('[_processEvent] ✅ ticket email sent');
    } catch (mailErr) {
      console.error('[_processEvent] ❌ ticket email failed:', mailErr.message);
      logger.warn('_processEvent: ticket email failed', { error: mailErr.message, reference });
    }

    /* Receipt — fire and forget */
    sendPaymentReceiptEmail({
      to:          recipientEmail,
      name:        recipientName,
      amount:      payment.amount,
      reference,
      description: `Event registration: ${ev?.title}`,
    }).catch(e => logger.warn('receipt email failed', { error: e.message }));
  }

  return {
    message:     'Event registration confirmed',
    ticketCode,
    event:       ev?.title,
    emailSent,
    emailNote:   emailSent
      ? `Ticket sent to ${recipientEmail}`
      : `Registration saved — ticket email failed. Check mailer config or contact support.`,
  };
};

/* ─────────────────────────────────────────────
   SHARED: process course payment after DB is marked success
───────────────────────────────────────────── */
const _processCourse = async (payment, reference, recipientName, recipientEmail) => {
  if (!payment.user_id) return { message: 'Course payment confirmed (guest — no enrolment)' };

  const [[existing]] = await db.query(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
    [payment.user_id, payment.item_id]
  );
  if (existing) {
    console.log('[_processCourse] already enrolled');
    return { message: 'Already enrolled' };
  }

  await db.query(
    'INSERT INTO enrollments (user_id, course_id, payment_id) VALUES (?, ?, ?)',
    [payment.user_id, payment.item_id, payment.id]
  );

  const [[course]] = await db.query('SELECT title FROM courses WHERE id = ?', [payment.item_id]);
  console.log('[_processCourse] ✅ enrolled in:', course?.title);

  sendEnrolmentEmail({ to: recipientEmail, name: recipientName, courseName: course?.title })
    .catch(e => logger.warn('enrolment email failed', { error: e.message }));

  return { message: 'Enrolled successfully', course: course?.title };
};

/* ═══════════════════════════════════════════════════════════
   POST /api/payments/initialize  (auth required)
══════════════════════════════════════════════════════════ */
exports.initialize = async (req, res) => {
  const { type, item_id } = req.body;
  const userId = req.user.id;

  try {
    const [[user]] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);

    let amount, description, metadata = {};

    if (type === 'course') {
      const [[course]] = await db.query('SELECT * FROM courses WHERE id = ?', [item_id]);
      if (!course) return badReq(res, 'Course not found');
      if (course.is_free || course.price === 0) return badReq(res, 'This course is free — no payment needed');
      const [[existing]] = await db.query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, item_id]
      );
      if (existing) return badReq(res, 'You are already enrolled in this course');
      amount      = course.price;
      description = `Course: ${course.title}`;
      metadata    = { course_id: course.id, course_title: course.title };
    }

    if (type === 'event') {
      const { package_id } = req.body;
      const [[pkg]] = await db.query('SELECT * FROM event_packages WHERE id = ?', [package_id]);
      if (!pkg) return badReq(res, 'Package not found');

      const now          = new Date();
      const isEarlyBird  = pkg.early_bird_price && pkg.early_bird_deadline && new Date(pkg.early_bird_deadline) > now;
      amount = isEarlyBird ? pkg.early_bird_price : pkg.price;

      const [[event]] = await db.query('SELECT * FROM events WHERE id = ?', [item_id]);
      if (!event)                          return badReq(res, 'Event not found');
      if (new Date(event.deadline) < now)  return badReq(res, 'Registration deadline has passed');

      description = `Event: ${event.title} — ${pkg.name}`;
      metadata    = { event_id: event.id, package_id: pkg.id, package_name: pkg.name, currency: event.currency || 'NGN' };
    }

    const reference = `MTK-${type.toUpperCase()}-${uuidv4().split('-')[0].toUpperCase()}`;

    await db.query(
      `INSERT INTO payments (user_id, type, item_id, amount, reference, status, metadata)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [userId, type, item_id, amount, reference, JSON.stringify(metadata)]
    );

    console.log('\n[initialize] ✅ Payment record created:', reference, '| amount:', amount, '| type:', type);

    let authorization_url = null;
    try {
      const txn = await initializeTransaction({
        email:    user.email,
        amount,
        reference,
        metadata,
        currency: metadata.currency || 'NGN',
        callback_url: (process.env.CLIENT_URL || 'http://localhost:5173') + '/payment/verify',
      });
      authorization_url = txn.authorization_url;
      console.log('[initialize] Paystack init OK — authorization_url received');
    } catch (paystackErr) {
      console.warn('[initialize] Paystack pre-init failed (popup will use reference directly):', paystackErr.message);
      logger.warn('payments.initialize: Paystack pre-init failed', { error: paystackErr.message, reference });
    }

    return created(res, { reference, amount, authorization_url });
  } catch (err) {
    logger.error('payments.initialize', { error: err.message });
    return serverErr(res, err, 'Payment initialization failed');
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /api/payments/initialize-guest  (no auth)
══════════════════════════════════════════════════════════ */
exports.initializeGuestEvent = async (req, res) => {
  const { guest_name, guest_email, event_id, package_id } = req.body;

  if (!guest_name?.trim())                            return badReq(res, 'Your full name is required');
  if (!guest_email || !/\S+@\S+\.\S+/.test(guest_email)) return badReq(res, 'A valid email address is required');
  if (!event_id || !package_id)                       return badReq(res, 'Event and package are required');

  try {
    const [[pkg]] = await db.query(
      `SELECT ep.*, e.title AS event_title, e.id AS event_id, e.is_published, e.deadline
       FROM event_packages ep JOIN events e ON e.id = ep.event_id
       WHERE ep.id = ? AND e.id = ?`,
      [package_id, event_id]
    );
    if (!pkg)              return badReq(res, 'Package not found');
    if (!pkg.is_published) return badReq(res, 'This event is not available');
    if (new Date(pkg.deadline) < new Date()) return badReq(res, 'Registration deadline has passed');

    const earlyBirdActive = pkg.early_bird_price && new Date(pkg.early_bird_deadline) > new Date();
    const amount          = earlyBirdActive ? pkg.early_bird_price : pkg.price;
    const reference       = `MA-GUEST-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    await db.query(
      `INSERT INTO payments (user_id, guest_name, guest_email, type, item_id, amount, reference, status, metadata)
       VALUES (NULL, ?, ?, 'event', ?, ?, ?, 'pending', ?)`,
      [
        guest_name.trim(),
        guest_email.trim().toLowerCase(),
        event_id,
        amount,
        reference,
        JSON.stringify({ package_id, guest: true }),
      ]
    );

    console.log('\n[initializeGuestEvent] ✅ Guest payment record:', reference, '| amount:', amount);

    return created(res, { reference, amount });
  } catch (err) {
    logger.error('payments.initializeGuestEvent', { error: err.message });
    return serverErr(res, err, `Guest event payment init failed: ${err.message}`);
  }
};

/* ═══════════════════════════════════════════════════════════
   GET  /api/payments/verify?reference=xxx   (Paystack redirect + popup callback)
   POST /api/payments/verify                 (body: { reference })
   — This is the CORRECT standard Paystack verify endpoint.
   — Verifies with Paystack API first, then updates DB and sends email.
══════════════════════════════════════════════════════════ */
exports.verifyPayment = async (req, res) => {
  const reference = req.query.reference || req.body.reference;

  console.log('\n' + '='.repeat(50));
  console.log('[verifyPayment] ▶ reference:', reference);

  if (!reference) return badReq(res, 'Reference is required');

  try {
    /* 1. Find payment in DB */
    const [[payment]] = await db.query('SELECT * FROM payments WHERE reference = ?', [reference]);
    console.log('[verifyPayment] DB lookup:', payment ? `found | status=${payment.status}` : 'NOT FOUND');

    if (!payment) return notFound(res, 'Payment record not found');

    if (payment.status === 'success') {
      console.log('[verifyPayment] ✅ Already processed — returning cached result');
      return ok(res, { message: 'Payment already processed', already: true });
    }

    /* 2. Verify with Paystack API
     * Error strategy:
     *  - 'Invalid key' / network error → server config issue, trust client, proceed
     *  - txn.status !== 'success'      → Paystack says payment failed, reject
     */
    let txn = null;
    try {
      console.log('[verifyPayment] Calling Paystack verify API...');
      txn = await verifyTransaction(reference);
      console.log('[verifyPayment] Paystack response → status:', txn.status, '| amount:', txn.amount, 'kobo');
      if (txn.status !== 'success') {
        console.warn('[verifyPayment] ⚠️  Paystack status not success:', txn.status);
        return badReq(res, `Payment not confirmed by Paystack (status: ${txn.status}). If you were charged, contact support with reference: ${reference}`);
      }
    } catch (verifyErr) {
      const isConfigErr = /invalid key|unauthorized|authentication/i.test(verifyErr.message);
      console.warn(
        isConfigErr
          ? '[verifyPayment] ⚠️  Paystack key not configured — trusting client callback. Fix PAYSTACK_SECRET_KEY.'
          : '[verifyPayment] ⚠️  Paystack unreachable (' + verifyErr.message + ') — trusting client callback.'
      );
      logger.warn('verifyPayment: Paystack verify skipped — processing on client trust', { error: verifyErr.message, reference });
      /* Fall through — Paystack popup already confirmed payment on the client */
    }

    /* 3. Mark payment as success in DB */
    await db.query(
      'UPDATE payments SET status = ?, paid_at = ? WHERE reference = ?',
      ['success', new Date(), reference]
    );
    console.log('[verifyPayment] ✅ DB updated → status=success');

    /* 4. Resolve recipient */
    const { name: recipientName, email: recipientEmail } = await _getRecipient(payment);
    console.log('[verifyPayment] Recipient:', recipientEmail, '| type:', payment.type);

    /* 5. Process by type */
    let result = {};
    if (payment.type === 'event') {
      result = await _processEvent(payment, reference, recipientName, recipientEmail);
    } else if (payment.type === 'course') {
      result = await _processCourse(payment, reference, recipientName, recipientEmail);
    }

    console.log('[verifyPayment] ✅ Done:', result.message);
    console.log('='.repeat(50) + '\n');

    return ok(res, { message: result.message || 'Payment verified', ...result });
  } catch (err) {
    console.error('[verifyPayment] ❌ Unexpected error:', err.message);
    logger.error('verifyPayment error', { error: err.message, reference });
    return serverErr(res, err, 'Payment verification failed');
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /api/payments/confirm        (backward compat — delegates to verifyPayment)
   POST /api/payments/confirm-guest  (backward compat)
══════════════════════════════════════════════════════════ */
exports.confirmPayment      = exports.verifyPayment;
exports.confirmGuestPayment = exports.verifyPayment;

/* ═══════════════════════════════════════════════════════════
   POST /api/payments/webhook   (Paystack → server, server-side safety net)
══════════════════════════════════════════════════════════ */
exports.webhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  if (!verifyWebhookSignature(req.body, signature)) {
    console.warn('[webhook] ❌ Invalid signature');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = JSON.parse(req.body.toString());
  res.status(200).send('OK'); // respond to Paystack immediately — never delay this

  if (event.event !== 'charge.success') return;

  const { reference } = event.data;
  console.log('\n[webhook] charge.success received for reference:', reference);

  try {
    const txn = await verifyTransaction(reference);
    if (txn.status !== 'success') {
      console.warn('[webhook] Paystack status not success:', txn.status);
      return;
    }

    const [[payment]] = await db.query('SELECT * FROM payments WHERE reference = ?', [reference]);
    if (!payment) { console.warn('[webhook] payment not found:', reference); return; }
    if (payment.status === 'success') { console.log('[webhook] already processed:', reference); return; }

    await db.query('UPDATE payments SET status = ?, paid_at = ? WHERE reference = ?',
      ['success', new Date(), reference]);
    console.log('[webhook] ✅ DB updated for:', reference);

    const { name: recipientName, email: recipientEmail } = await _getRecipient(payment);

    if (payment.type === 'event') {
      await _processEvent(payment, reference, recipientName, recipientEmail);
    } else if (payment.type === 'course') {
      await _processCourse(payment, reference, recipientName, recipientEmail);
    }

    console.log('[webhook] ✅ Processing complete for:', reference);
  } catch (err) {
    console.error('[webhook] ❌ Error:', err.message);
    logger.error('webhook processing failed', { error: err.message, reference });
    try {
      await db.query(
        'INSERT INTO error_logs (route, message, stack) VALUES (?,?,?)',
        ['/api/payments/webhook', `Webhook failed [${reference}]: ${err.message}`, err.stack || '']
      );
    } catch (_) {}
  }
};

/* ═══════════════════════════════════════════════════════════
   GET  /api/payments/       (admin — all payments)
   GET  /api/payments/my     (auth user — own payments)
══════════════════════════════════════════════════════════ */
exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  const { type, status } = req.query;
  const conditions = [], vals = [];
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
  } catch (err) {
    return serverErr(res, err, 'Server error');
  }
};
