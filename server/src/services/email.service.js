/**
 * Email Service — Muhsinah Academy
 * Uses Gmail SMTP via Nodemailer (free)
 */
const transporter = require('../config/mailer');
const { generateQrDataUrl } = require('./ticket.service');

const BRAND      = 'Muhsinah Academy';
const SITE_URL   = process.env.CLIENT_URL || 'https://www.muhsinahacademy.com';
/* MAIL_FROM must match GMAIL_USER exactly — Gmail rejects mismatched senders */
const SENDER_EMAIL = (process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@muhsinahacademy.com').trim();
const MAIL_FROM    = `Muhsinah Academy <${SENDER_EMAIL}>`; // built dynamically from SMTP config

const GREEN_DARK = '#0D3B15';
const GREEN      = '#1D6B1D';
const GREEN_TINT = '#EBF7DC';
const GOLD       = '#D4A017';

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
  const isVerify = type === 'verify_email';
  const mail = {
    from: MAIL_FROM, to,
    subject: isVerify ? `Verify your email — ${BRAND}` : `Reset your password — ${BRAND}`,
    html: base(`
      <p>Assalamu Alaikum <strong>${name}</strong>,</p>
      <p>Use this code to ${isVerify ? 'verify your email' : 'reset your password'}. It expires in <strong>30 minutes</strong>.</p>
      <div class="ticket">
        <p style="color:#6B7B6B;margin:0 0 8px;font-size:13px">Your verification code</p>
        <div class="ticket-code">${otp}</div>
      </div>
      <p style="font-size:13px;color:#888">If you did not request this, please ignore this email.</p>
    `)
  };
  try {
    await transporter.sendMail(mail);
    await logEmail({ to, subject: mail.subject, type: 'otp', status: 'sent' });
  } catch (err) {
    await logEmail({ to, subject: mail.subject, type: 'otp', status: 'failed', error: err.message });
    throw err;
  }
};

/** Welcome after successful registration */
const sendWelcomeEmail = async ({ to, name }) => {
  const mail = {
    from: MAIL_FROM, to,
    subject: `Welcome to ${BRAND}`,
    html: base(`
      <p>Assalamu Alaikum <strong>${name}</strong>,</p>
      <p>Welcome to <strong>${BRAND}</strong>! Your account is now verified and ready.</p>
      <p>You can now browse courses, register for events, and book a personal consultation with Coach Madinah.</p>
      <div style="text-align:center"><a href="${SITE_URL}/courses" class="btn">Explore Courses</a></div>
      <p>JazakAllahu Khairan for joining us. We are honoured to walk this journey with you.</p>
    `)
  };
  try {
    await transporter.sendMail(mail);
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'sent' });
  } catch (err) {
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'failed', error: err.message });
    throw err;
  }
};

/** Course enrolment */
const sendEnrolmentEmail = async ({ to, name, courseName }) => {
  const mail = {
    from: MAIL_FROM, to,
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
    `)
  };
  try {
    await transporter.sendMail(mail);
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'sent' });
  } catch (err) {
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'failed', error: err.message });
    throw err;
  }
};

/** Event ticket with QR code, WhatsApp link and full event details */
const sendEventTicketEmail = async ({ to, name, event, packageName, ticketCode, whatsappLink }) => {
  const qrDataUrl = await generateQrDataUrl(ticketCode);
  const dateStr   = new Date(event.event_date).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = new Date(event.event_date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  const isOnline = event.type === 'online';

  const locationHtml = isOnline
    ? `<div class="info"><span class="label">Format</span><span>🌐 Online (join link below)</span></div>`
    : `<div class="info"><span class="label">Venue</span><span>📍 ${event.venue || 'TBA'}</span></div>`;

  const onlineLinkSection = (isOnline && event.online_link) ? `
    <div style="background:#EBF7DC;border-left:4px solid ${GREEN};border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0 0 8px;font-weight:700;color:${GREEN_DARK}">Online Join Link</p>
      <p style="margin:0 0 12px;font-size:13px;color:#2D6A2D">Click the button below at event time to join. Please do not share this link.</p>
      <div style="text-align:center"><a href="${event.online_link}" class="btn" style="background:${GREEN}">Join Event</a></div>
    </div>` : '';

  const descriptionSection = event.description ? `
    <div style="margin:20px 0;padding:16px;background:#F9FBF6;border-radius:8px;border:1px solid #D4E8C4">
      <p style="margin:0 0 8px;font-weight:700;color:${GREEN_DARK};font-size:14px">About This Event</p>
      <p style="margin:0;font-size:14px;color:#2D3A2D;line-height:1.6;white-space:pre-line">${event.description}</p>
    </div>` : '';

  const whatsappSection = whatsappLink ? `
    <div class="whatsapp-box">
      <p style="margin:0 0 8px;font-weight:700;color:#1A5C2A">Join the Private WhatsApp Group</p>
      <p style="margin:0 0 12px;font-size:13px;color:#2D6A2D">This link is exclusively for registered participants. Please do not share it publicly.</p>
      <div style="text-align:center"><a href="${whatsappLink}" class="whatsapp-btn">Join WhatsApp Group</a></div>
    </div>` : '';

  const mail = {
    from: MAIL_FROM, to,
    subject: `Your Ticket: ${event.title} — ${BRAND}`,
    html: base(`
      <p>Assalamu Alaikum <strong>${name}</strong>,</p>
      <p>Your registration is confirmed! Here is your ticket for <strong>${event.title}</strong>:</p>

      <div class="ticket">
        <span class="gold-badge">${packageName}</span>
        <p style="font-size:20px;font-weight:800;color:${GREEN_DARK};margin:12px 0 8px">${event.title}</p>
        <div class="info" style="justify-content:center"><span>📅 ${dateStr}</span></div>
        <div class="info" style="justify-content:center"><span>🕐 ${timeStr}</span></div>
        ${locationHtml}
        <img src="${qrDataUrl}" alt="QR Ticket" style="width:150px;height:150px;margin:16px auto;display:block"/>
        <div class="ticket-code">${ticketCode}</div>
        <p style="font-size:11px;color:#888;margin:4px 0 0">Present this QR code or ticket code at the entrance</p>
      </div>

      ${descriptionSection}
      ${onlineLinkSection}
      ${whatsappSection}

      <div style="background:#FFF8E7;border-left:4px solid ${GOLD};border-radius:8px;padding:14px 16px;margin:20px 0">
        <p style="margin:0;font-size:13px;color:#5C4500"><strong>📌 Reminder:</strong> Please arrive 10–15 minutes early. Bring this email or your ticket code for check-in.</p>
      </div>

      <p>We look forward to seeing you. Barakallahu feekum. 🌿</p>
      <div style="text-align:center;margin-top:16px">
        <a href="${SITE_URL}/events" class="btn">View All Events</a>
      </div>
    `)
  };
  try {
    await transporter.sendMail(mail);
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'sent' });
  } catch (err) {
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'failed', error: err.message });
    throw err;
  }
};

/** Payment receipt */
const sendPaymentReceiptEmail = async ({ to, name, amount, reference, description }) => {
  const mail = {
    from: MAIL_FROM, to,
    subject: `Payment Receipt — ${BRAND}`,
    html: base(`
      <p>Assalamu Alaikum <strong>${name}</strong>,</p>
      <p>We have received your payment. Here is your receipt:</p>
      <div class="ticket" style="text-align:left">
        <div class="info"><span class="label">Description</span><span>${description}</span></div>
        <div class="info"><span class="label">Amount</span><span style="font-weight:700;font-size:18px">₦${Number(amount).toLocaleString()}</span></div>
        <div class="info"><span class="label">Reference</span><span style="font-family:monospace;font-size:13px">${reference}</span></div>
        <div class="info"><span class="label">Date</span><span>${new Date().toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'})}</span></div>
      </div>
      <p style="font-size:13px;color:#888">Please keep this reference for your records. JazakAllahu Khairan.</p>
    `)
  };
  try {
    await transporter.sendMail(mail);
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'sent' });
  } catch (err) {
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'failed', error: err.message });
    throw err;
  }
};

module.exports = { sendOtpEmail, sendWelcomeEmail, sendEnrolmentEmail, sendEventTicketEmail, sendPaymentReceiptEmail, sendContactNotification };

/** Contact form notification to admin */
async function sendContactNotification ({ name, email, subject, message }) {
  // Primary recipient = site_email from settings (Coach Madinah's inbox)
  // Fallback = GMAIL_USER (the sending account) if settings not available
  let recipientEmail = process.env.SMTP_USER || process.env.GMAIL_USER;
  try {
    const db = require('../config/db');
    const [[row]] = await db.query("SELECT `value` FROM settings WHERE `key` = 'site_email'");
    if (row?.value) recipientEmail = row.value;
  } catch { /* use fallback */ }

  if (!recipientEmail) return;
  const mail = {
    from:    MAIL_FROM,
    to:      recipientEmail,
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
      <p style="font-size:13px;color:#888">View all messages in your <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/messages" style="color:var(--green)">Admin Panel → Messages</a>.</p>
    `)
  };
  try {
    await transporter.sendMail(mail);
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'sent' });
  } catch (err) {
    await logEmail({ to: mail.to, subject: mail.subject, type: 'email', status: 'failed', error: err.message });
    throw err;
  }
}
