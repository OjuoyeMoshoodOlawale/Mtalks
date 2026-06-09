const transporter = require('../config/mailer');
const { generateQrDataUrl } = require('./ticket.service');

const BRAND_GREEN = '#1D6B1D';
const BRAND_DARK  = '#0D3B15';
const BRAND_GOLD  = '#F0C130';

const baseHtml = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#F5F7F2;font-family:'DM Sans',Arial,sans-serif;color:#1A2B1A}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E0EDD0}
  .header{background:${BRAND_DARK};padding:28px 32px;text-align:center}
  .header img{max-height:50px}
  .header h1{color:#fff;margin:12px 0 0;font-size:20px;font-weight:600}
  .body{padding:32px}
  .footer{background:${BRAND_GREEN};padding:20px 32px;text-align:center;color:#fff;font-size:12px}
  .btn{display:inline-block;padding:12px 28px;background:${BRAND_GREEN};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0}
  .info-row{display:flex;gap:12px;margin:8px 0;font-size:14px}
  .label{color:#6B7B6B;min-width:100px}
  .ticket-box{background:#EBF7DC;border:2px solid ${BRAND_GREEN};border-radius:12px;padding:20px;margin:20px 0;text-align:center}
  .ticket-code{font-size:22px;font-weight:700;color:${BRAND_DARK};letter-spacing:3px;margin:8px 0}
  .gold-badge{background:${BRAND_GOLD};color:#000;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>MTalks Life & Marriage Coaching</h1>
    <p style="color:#9FE1CB;margin:4px 0 0;font-size:13px">muhsinahacademy.com</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p style="margin:0">© ${new Date().getFullYear()} MTalks Life & Marriage Coaching · Abuja, Nigeria</p>
    <p style="margin:4px 0 0;opacity:.8">madeenahsanni@gmail.com</p>
  </div>
</div>
</body>
</html>`;

/** OTP email for email verification / password reset */
const sendOtpEmail = async ({ to, name, otp, type }) => {
  const subject = type === 'verify_email' ? 'Verify your email — MTalks' : 'Reset your password — MTalks';
  const action  = type === 'verify_email' ? 'verify your email address' : 'reset your password';

  const html = baseHtml(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Use the code below to ${action}. It expires in <strong>15 minutes</strong>.</p>
    <div class="ticket-box">
      <p style="margin:0;font-size:13px;color:#6B7B6B">Your verification code</p>
      <div class="ticket-code">${otp}</div>
    </div>
    <p style="font-size:13px;color:#888">If you did not request this, please ignore this email.</p>
  `);

  await transporter.sendMail({
    from:    `"MTalks Academy" <${process.env.MAIL_FROM || 'noreply@muhsinahacademy.com'}>`,
    to, subject, html
  });
};

/** Welcome email after successful registration */
const sendWelcomeEmail = async ({ to, name }) => {
  const html = baseHtml(`
    <p>Assalamu Alaikum <strong>${name}</strong>,</p>
    <p>Welcome to <strong>MTalks Life & Marriage Coaching</strong>. Your account has been verified and you're all set!</p>
    <p>You can now browse and enrol in courses, register for events, and book a personal consultation with Coach Madinah.</p>
    <a class="btn" href="${process.env.CLIENT_URL}/courses">Explore Courses</a>
    <p>JazakAllahu Khairan for joining us.</p>
  `);

  await transporter.sendMail({
    from: `"MTalks Academy" <${process.env.MAIL_FROM}>`,
    to,
    subject: 'Welcome to MTalks Academy',
    html
  });
};

/** Course enrolment confirmation */
const sendEnrolmentEmail = async ({ to, name, courseName }) => {
  const html = baseHtml(`
    <p>Assalamu Alaikum <strong>${name}</strong>,</p>
    <p>Your enrolment is confirmed. You now have full access to:</p>
    <div class="ticket-box">
      <p style="margin:0;font-size:13px;color:#6B7B6B">Enrolled course</p>
      <p style="font-size:18px;font-weight:700;color:${BRAND_DARK};margin:8px 0">${courseName}</p>
    </div>
    <a class="btn" href="${process.env.CLIENT_URL}/dashboard/courses">Go to My Courses</a>
    <p style="font-size:13px;color:#888">Learn at your own pace. Your progress is saved automatically.</p>
  `);

  await transporter.sendMail({
    from: `"MTalks Academy" <${process.env.MAIL_FROM}>`,
    to,
    subject: `Enrolled: ${courseName} — MTalks Academy`,
    html
  });
};

/** Event ticket email with QR code */
const sendEventTicketEmail = async ({ to, name, event, packageName, ticketCode, whatsappLink }) => {
  const qrDataUrl = await generateQrDataUrl(ticketCode);

  const whatsappSection = whatsappLink ? `
    <div style="margin:20px 0;padding:16px;background:#EBF7DC;border-radius:8px;border-left:4px solid ${BRAND_GREEN}">
      <p style="margin:0 0 8px;font-weight:600;color:${BRAND_DARK}">Join the WhatsApp Group</p>
      <p style="margin:0;font-size:13px">This link is exclusive to registered participants. Do not share it publicly.</p>
      <a href="${whatsappLink}" class="btn" style="display:inline-block;margin-top:10px;background:#25D366">Join WhatsApp Group</a>
    </div>` : '';

  const html = baseHtml(`
    <p>Assalamu Alaikum <strong>${name}</strong>,</p>
    <p>Your registration for <strong>${event.title}</strong> is confirmed!</p>
    <div class="ticket-box">
      <span class="gold-badge">${packageName}</span>
      <p style="font-size:18px;font-weight:700;color:${BRAND_DARK};margin:12px 0 4px">${event.title}</p>
      <p style="margin:4px 0;font-size:13px;color:#6B7B6B">
        ${new Date(event.event_date).toLocaleDateString('en-NG', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} &nbsp;·&nbsp;
        ${new Date(event.event_date).toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' })}
      </p>
      ${event.type === 'offline'
        ? `<p style="margin:4px 0;font-size:13px;color:#6B7B6B">📍 ${event.venue}</p>`
        : `<p style="margin:4px 0;font-size:13px;color:#6B7B6B">💻 Online — link will be provided</p>`
      }
      <img src="${qrDataUrl}" alt="Ticket QR Code" style="width:160px;height:160px;margin:16px auto;display:block"/>
      <div class="ticket-code">${ticketCode}</div>
      <p style="margin:4px 0 0;font-size:11px;color:#888">Present this QR code or code at the event entrance</p>
    </div>
    ${whatsappSection}
    <p style="font-size:13px;color:#888">We look forward to seeing you. Barakallahu feekum.</p>
  `);

  await transporter.sendMail({
    from: `"MTalks Academy" <${process.env.MAIL_FROM}>`,
    to,
    subject: `Your Ticket: ${event.title} — MTalks Academy`,
    html
  });
};

/** Payment receipt */
const sendPaymentReceiptEmail = async ({ to, name, amount, reference, description }) => {
  const html = baseHtml(`
    <p>Assalamu Alaikum <strong>${name}</strong>,</p>
    <p>We have received your payment. Here is your receipt:</p>
    <div class="ticket-box">
      <div class="info-row"><span class="label">Description</span><span>${description}</span></div>
      <div class="info-row"><span class="label">Amount</span><span><strong>₦${Number(amount).toLocaleString()}</strong></span></div>
      <div class="info-row"><span class="label">Reference</span><span style="font-family:monospace">${reference}</span></div>
      <div class="info-row"><span class="label">Date</span><span>${new Date().toLocaleDateString('en-NG', {year:'numeric',month:'long',day:'numeric'})}</span></div>
    </div>
    <p style="font-size:13px;color:#888">Please keep this reference for your records. JazakAllahu Khairan.</p>
  `);

  await transporter.sendMail({
    from: `"MTalks Academy" <${process.env.MAIL_FROM}>`,
    to,
    subject: `Payment Receipt — MTalks Academy`,
    html
  });
};

module.exports = { sendOtpEmail, sendWelcomeEmail, sendEnrolmentEmail, sendEventTicketEmail, sendPaymentReceiptEmail };
