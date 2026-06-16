/**
 * Nodemailer — supports both cPanel SMTP and Gmail
 *
 * For cPanel (recommended — better deliverability):
 *   SMTP_HOST=mail.muhsinahacademy.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true
 *   SMTP_USER=noreply@muhsinahacademy.com
 *   SMTP_PASS=your_cpanel_email_password
 *
 * For Gmail fallback:
 *   GMAIL_USER=themuhsinahacademy@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 */
const nodemailer = require('nodemailer');

const useCpanel = !!process.env.SMTP_HOST;

let config;
if (useCpanel) {
  config = {
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }  // allow cPanel self-signed certs
  };
} else {
  config = {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    }
  };
}

const transporter = nodemailer.createTransport(config);

transporter.verify()
  .then(() => {
    const from = useCpanel ? process.env.SMTP_USER : process.env.GMAIL_USER;
    console.log('[Mailer] SMTP ready — sending from:', from);
  })
  .catch((err) => {
    console.error('\n[Mailer] SMTP FAILED:', err.message);
    if (useCpanel) {
      console.error('[Mailer] Host:', process.env.SMTP_HOST);
      console.error('[Mailer] User:', process.env.SMTP_USER);
    } else {
      console.error('[Mailer] Gmail:', process.env.GMAIL_USER);
    }
    console.error('[Mailer] Emails will fail until SMTP is fixed\n');
  });

module.exports = transporter;
