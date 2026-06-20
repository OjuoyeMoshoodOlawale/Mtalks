/**
 * Email Service — Muhsinah Academy
 * Sends via cPanel SMTP; auto-falls back to Gmail if cPanel is down.
 */
const mailer = require("../config/mailer");
const db = require("../config/db");
const { generateQrDataUrl } = require("./ticket.service");

/**
 * logEmail — writes a record to email_logs for audit/debugging.
 * Fails silently so a logging error never crashes an email send.
 */
/**
 * logEmail — fire-and-forget audit log. NEVER awaited in the send path
 * so a DB error here can never cause an email to appear as failed.
 * Column names match schema: to_email, error, created_at (auto).
 */
const logEmail = ({ to, subject, type, status, error = null }) => {
  db.query(
    "INSERT INTO email_logs (to_email, subject, type, status, error) VALUES (?, ?, ?, ?, ?)",
    [to, subject, type, status, error],
  ).catch((e) =>
    console.warn("[logEmail] DB insert failed (non-fatal):", e.message),
  );
};

const BRAND = "Muhsinah Academy";
const SITE_URL = process.env.CLIENT_URL || "https://www.muhsinahacademy.com";

/* MAIL_FROM is resolved at send-time so it always matches whichever transport
 * is active. Gmail rejects emails where From: doesn't match the auth sender. */
const getMailFrom = () =>
  `Muhsinah Academy <${mailer.getActiveUser() || "noreply@themuhsinahacademy.com"}>`;

const GREEN_DARK = "#0D3B15";
const GREEN = "#1D6B1D";
const GREEN_TINT = "#EBF7DC";
const GOLD = "#D4A017";

const base = (content) => `
<!DOCTYPE html><html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${BRAND}</title>
<style>
  body{margin:0;padding:0;background:#F5F7F2;font-family:'Segoe UI',Arial,sans-serif;color:#1A2B1A}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #D4E8C4}
  .hdr{background:${GREEN_DARK};padding:28px 32px;text-align:center}
  .hdr-title{color:#fff;margin:10px 0 0;font-size:20px;font-weight:700;letter-spacing:.5px}
  .hdr-sub{color:rgba(255,255,255,.6);font-size:13px;margin:4px 0 0}
  .body{padding:32px}
  .footer{background:${GREEN};padding:18px 32px;text-align:center;color:rgba(255,255,255,.75);font-size:12px}
  .btn{display:inline-block;padding:12px 28px;background:${GREEN};color:#fff!important;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0}
  .whatsapp-btn{display:inline-block;padding:12px 28px;background:#25D366;color:#fff!important;text-decoration:none;border-radius:8px;font-weight:600;margin:8px 0}
  .ticket{background:${GREEN_TINT};border:2px solid ${GREEN};border-radius:12px;padding:24px;margin:20px 0;text-align:center}
  .ticket-code{font-size:22px;font-weight:800;color:${GREEN_DARK};letter-spacing:4px;margin:12px 0;font-family:monospace}
  .info{display:flex;gap:10px;margin:8px 0;font-size:14px}
  .label{color:#6B7B6B;min-width:110px;font-weight:600}
  .gold-badge{background:${GOLD};color:#000;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block}
  .whatsapp-box{background:#e8f9f0;border-left:4px solid #25D366;border-radius:8px;padding:16px;margin:20px 0}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div style="font-size:32px;font-weight:900;color:#76C442;letter-spacing:-1px">M</div>
    <p class="hdr-title">${BRAND}</p>
    <p class="hdr-sub">muhsinahacademy.com</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p style="margin:0">© ${new Date().getFullYear()} Muhsinah Academy · Abuja, Nigeria</p>
    <p style="margin:4px 0 0;font-size:11px">All sessions are private and confidential</p>
  </div>
</div>
</body></html>`;

/** OTP for email verification / password reset */
const sendOtpEmail = async ({ to, name, otp, type }) => {
  const isVerify = type === "verify_email";
  const mail = {
    from: getMailFrom(),
    to,
    subject: isVerify
      ? `Verify your email — ${BRAND}`
      : `Reset your password — ${BRAND}`,
    html: base(`
      <p>Assalamu Alaikum <strong>${name}</strong>,</p>
      <p>Use this code to ${isVerify ? "verify your email" : "reset your password"}. It expires in <strong>30 minutes</strong>.</p>
      <div class="ticket">
        <p style="color:#6B7B6B;margin:0 0 8px;font-size:13px">Your verification code</p>
        <div class="ticket-code">${otp}</div>
      </div>
      <p style="font-size:13px;color:#888">If you did not request this, please ignore this email.</p>
    `),
  };
  try {
    await mailer.sendMail(mail);
    logEmail({ to, subject: mail.subject, type: "otp", status: "sent" });
  } catch (err) {
    logEmail({
      to,
      subject: mail.subject,
      type: "otp",
      status: "failed",
      error: err.message,
    });
    throw err;
  }
};

/** Welcome after successful registration */
const sendWelcomeEmail = async ({ to, name }) => {
  const mail = {
    from: getMailFrom(),
    to,
    subject: `Welcome to ${BRAND}`,
    html: base(`
      <p>Assalamu Alaikum <strong>${name}</strong>,</p>
      <p>Welcome to <strong>${BRAND}</strong>! Your account is now verified and ready.</p>
      <p>You can now browse courses, register for events, and book a personal consultation with Coach Madinah.</p>
      <div style="text-align:center"><a href="${SITE_URL}/courses" class="btn">Explore Courses</a></div>
      <p>JazakAllahu Khairan for joining us. We are honoured to walk this journey with you.</p>
    `),
  };
  try {
    await mailer.sendMail(mail);
    logEmail({
      to: mail.to,
      subject: mail.subject,
      type: "email",
      status: "sent",
    });
  } catch (err) {
    logEmail({
      to: mail.to,
      subject: mail.subject,
      type: "email",
      status: "failed",
      error: err.message,
    });
    throw err;
  }
};

/** Course enrolment */
const sendEnrolmentEmail = async ({ to, name, courseName }) => {
  const mail = {
    from: getMailFrom(),
    to,
    subject: `Enrolled: ${courseName} — ${BRAND}`,
    html: base(`
      <p>Assalamu Alaikum <strong>${name}</strong>,</p>
      <p>Your enrolment is confirmed! You now have full access to:</p>
      <div class="ticket">
        <p style="color:#6B7B6B;margin:0 0 8px;font-size:13px">Enrolled course</p>
        <p style="font-size:18px;font-weight:700;color:${GREEN_DARK};margin:0">${courseName}</p>
      </div>
      <div style="text-align:center"><a href="${SITE_URL}/dashboard/courses" class="btn">Go to My Courses</a></div>
      <p style="font-size:13px;color:#888">Learn at your own pace — your progress is saved automatically.</p>
    `),
  };
  try {
    await mailer.sendMail(mail);
    logEmail({
      to: mail.to,
      subject: mail.subject,
      type: "email",
      status: "sent",
    });
  } catch (err) {
    logEmail({
      to: mail.to,
      subject: mail.subject,
      type: "email",
      status: "failed",
      error: err.message,
    });
    throw err;
  }
};

/** Event registration confirmation
 *
 * Customer-first design — Paystack already sends the receipt.
 * We send ONLY what the customer needs to attend:
 *   1. Confirmation + event name/date/time   (save it)
 *   2. WhatsApp link or meeting link         (join now)
 *   3. Ticket code + QR                      (check-in)
 *   4. What's included in their package      (expectations)
 *   5. Contact / reminder                    (support)
 */
const sendEventTicketEmail = async ({
  to, name, event, pkg, packageName, ticketCode,
}) => {
  if (!to)    throw new Error('sendEventTicketEmail: to is missing');
  if (!event) throw new Error('sendEventTicketEmail: event is missing');

  const mode        = event.delivery_mode || (event.type === 'offline' ? 'physical' : 'online_meeting');
  const isPhysical  = mode === 'physical';
  const isWhatsapp  = mode === 'whatsapp';
  const isOnlineMt  = mode === 'online_meeting';
  const isHybrid    = mode === 'hybrid';

  /* ── Date + time ── */
  const evDate  = new Date(event.event_date);
  const dateStr = evDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = evDate.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  /* ── QR code (physical/hybrid only — needed for door check-in) ── */
  let qrHtml = '';
  if (isPhysical || isHybrid) {
    try {
      const qrUrl = await generateQrDataUrl(ticketCode);
      qrHtml = `
        <div style="text-align:center;margin:20px 0">
          <img src="${qrUrl}" alt="Your QR Ticket" width="160" height="160"
               style="display:block;margin:0 auto 10px;border:3px solid ${GREEN};border-radius:12px"/>
          <p style="margin:0;font-size:12px;color:#6B7B6B">Screenshot and save this QR code</p>
        </div>`;
    } catch (e) {
      console.warn('[ticket email] QR skipped:', e.message);
    }
  }

  /* ── HOW TO JOIN — the most important CTA for the customer ── */
  let joinHtml = '';

  if (event.whatsapp_link) {
    const label = isWhatsapp
      ? 'Join the WhatsApp Programme'
      : 'Join the Private WhatsApp Group';
    const note  = isWhatsapp
      ? 'This programme runs entirely on WhatsApp. Join the group now to receive sessions and materials.'
      : 'Your event community is on WhatsApp. Join to get updates, the meeting link, and connect with other participants.';
    joinHtml += `
      <div style="background:#e8f9f0;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center">
        <p style="margin:0 0 6px;font-weight:800;font-size:16px;color:#1A5C2A">${label}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#2D6A2D">${note}</p>
        <a href="${event.whatsapp_link}"
           style="display:inline-block;background:#25D366;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
          Open WhatsApp Group
        </a>
      </div>`;
  }

  if ((isOnlineMt || isHybrid) && event.meeting_link) {
    joinHtml += `
      <div style="background:${GREEN_TINT};border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center">
        <p style="margin:0 0 6px;font-weight:800;font-size:16px;color:${GREEN_DARK}">Online Join Link</p>
        <p style="margin:0 0 16px;font-size:13px;color:#2D6A2D">
          Use this link to join at event time. This link is personal — please do not share it.
        </p>
        <a href="${event.meeting_link}"
           style="display:inline-block;background:${GREEN};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
          Join the Session
        </a>
      </div>`;
  }

  /* ── Venue (physical/hybrid) ── */
  const venueHtml = (isPhysical || isHybrid) && event.venue
    ? `<div style="margin:16px 0;padding:14px 18px;background:#f5f7f2;border-radius:8px;border-left:4px solid ${GREEN}">
        <p style="margin:0;font-size:13px;color:#2D3A2D">
          <strong>Venue:</strong> ${event.venue}
        </p>
       </div>`
    : '';

  /* ── Package perks (what did they pay for?) ── */
  let perksHtml = '';
  if (pkg?.description || pkg?.perks) {
    const perks = (() => { try { return pkg.perks ? JSON.parse(pkg.perks) : null; } catch { return null; } })();
    perksHtml = `
      <div style="margin:20px 0;padding:16px 20px;background:#FFFDF0;border-radius:10px;border:1px solid #F0E0A0">
        <p style="margin:0 0 10px;font-weight:700;color:${GREEN_DARK};font-size:13px;text-transform:uppercase;letter-spacing:.05em">
          What is included — ${packageName}
        </p>
        ${pkg.description ? `<p style="margin:0 0 8px;font-size:13px;color:#4A4A2A">${pkg.description}</p>` : ''}
        ${Array.isArray(perks) && perks.length
          ? `<ul style="margin:6px 0 0;padding-left:18px">${perks.map(p => `<li style="margin:4px 0;font-size:13px;color:#2D3A2D">${p}</li>`).join('')}</ul>`
          : ''}
      </div>`;
  }

  /* ── Physical reminder ── */
  const reminderHtml = (isPhysical || isHybrid)
    ? `<div style="background:#FFF8E7;border-left:4px solid ${GOLD};border-radius:8px;padding:12px 16px;margin:20px 0">
        <p style="margin:0;font-size:13px;color:#5C4500">
          <strong>Reminder:</strong> Please arrive 10 to 15 minutes before the event starts.
          Bring this email or your ticket code for check-in at the door.
        </p>
       </div>`
    : '';

  const html = base(`
    <p style="margin:0 0 4px">Assalamu Alaikum <strong>${name}</strong>,</p>
    <p style="margin:0 0 24px;color:#2D3A2D">You are confirmed for the following event. See everything you need below.</p>

    <!-- Event summary card -->
    <div style="background:${GREEN_DARK};border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">
      <span style="background:${GOLD};color:#000;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:800;display:inline-block;margin-bottom:14px">
        ${packageName}
      </span>
      <h2 style="color:#fff;margin:0 0 14px;font-size:20px;line-height:1.3">${event.title}</h2>
      <div style="display:inline-block;background:rgba(255,255,255,.12);border-radius:10px;padding:12px 24px">
        <p style="color:#A8D5A2;margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Date and Time</p>
        <p style="color:#fff;margin:0;font-size:16px;font-weight:700">${dateStr}</p>
        <p style="color:#D4E8C4;margin:4px 0 0;font-size:14px">${timeStr}</p>
      </div>
    </div>

    ${joinHtml}
    ${venueHtml}
    ${qrHtml}

    <!-- Ticket reference -->
    <div style="text-align:center;margin:20px 0;padding:16px;background:#F5F7F2;border-radius:10px;border:1px dashed #B8D4A0">
      <p style="margin:0 0 6px;font-size:12px;color:#6B7B6B;text-transform:uppercase;letter-spacing:.08em;font-weight:700">Your Ticket Reference</p>
      <p style="margin:0;font-family:monospace;font-size:22px;font-weight:800;color:${GREEN_DARK};letter-spacing:4px">${ticketCode}</p>
      <p style="margin:6px 0 0;font-size:11px;color:#9AA89A">Mention this reference if you contact us</p>
    </div>

    ${perksHtml}
    ${reminderHtml}

    <p style="margin-top:28px;color:#2D3A2D;font-size:14px">
      We look forward to seeing you.<br/>
      <strong>Barakallahu feekum.</strong>
    </p>
    <p style="font-size:12px;color:#888;margin-top:8px">
      Questions? Reply to this email or message us on WhatsApp.
    </p>
  `);

  const mail = { from: getMailFrom(), to, subject: `You are in: ${event.title} — ${BRAND}`, html };

  try {
    await mailer.sendMail(mail);
    logEmail({ to, subject: mail.subject, type: 'event_ticket', status: 'sent' });
    console.log('[sendEventTicketEmail] sent to:', to);
  } catch (err) {
    logEmail({ to, subject: mail.subject, type: 'event_ticket', status: 'failed', error: err.message });
    throw err;
  }
};


/** Payment receipt — intentionally skipped.
 * Paystack automatically emails the customer a full payment receipt
 * (with amount, reference, card details, timestamp) after every successful
 * charge. Sending a duplicate receipt is redundant and clutters the inbox.
 * This function is kept so existing callers don't break — it simply resolves.
 */
const sendPaymentReceiptEmail = async () => {
  /* no-op — Paystack handles receipts */
};


/** Contact form notification to admin */
async function sendContactNotification({ name, email, subject, message }) {
  // Primary recipient = site_email from settings (Coach Madinah's inbox)
  // Fallback = GMAIL_USER (the sending account) if settings not available
  let recipientEmail = process.env.SMTP_USER || process.env.GMAIL_USER;
  try {
    const [[row]] = await db.query(
      "SELECT `value` FROM settings WHERE `key` = 'site_email'",
    );
    if (row?.value) recipientEmail = row.value;
  } catch {
    /* use fallback */
  }

  if (!recipientEmail) return;
  const mail = {
    from: getMailFrom(),
    to: recipientEmail,
    replyTo: email,
    subject: `[Muhsinah Academy] New Message: ${subject}`,
    html: base(`
      <p>A new message has been submitted via the contact form on <strong>muhsinahacademy.com</strong>.</p>
      <div class="ticket" style="text-align:left">
        <div class="info"><span class="label">Name</span><span>${name}</span></div>
        <div class="info"><span class="label">Email</span><span><a href="mailto:${email}" style="color:var(--green)">${email}</a></span></div>
        <div class="info"><span class="label">Subject</span><span>${subject}</span></div>
        <div class="info" style="flex-direction:column;gap:6px">
          <span class="label">Message</span>
          <span style="white-space:pre-line;background:#f5f7f2;padding:12px;border-radius:6px;font-size:14px">${message}</span>
        </div>
      </div>
      <p style="font-size:13px">You can reply directly to this email to respond to ${name}.</p>
      <p style="font-size:13px;color:#888">View all messages in your <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/admin/messages" style="color:var(--green)">Admin Panel → Messages</a>.</p>
    `),
  };
  try {
    await mailer.sendMail(mail);
    logEmail({
      to: mail.to,
      subject: mail.subject,
      type: "email",
      status: "sent",
    });
  } catch (err) {
    logEmail({
      to: mail.to,
      subject: mail.subject,
      type: "email",
      status: "failed",
      error: err.message,
    });
    throw err;
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendEnrolmentEmail,
  sendEventTicketEmail,
  sendPaymentReceiptEmail,
  sendContactNotification,
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendEnrolmentEmail,
  sendEventTicketEmail,
  sendPaymentReceiptEmail,
  sendContactNotification,
};
