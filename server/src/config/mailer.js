/**
 * Nodemailer transporter — Gmail (free)
 *
 * Setup steps for Coach Madinah:
 * 1. Sign in to Gmail → Google Account → Security → 2-Step Verification → Enable it
 * 2. Go to Security → App Passwords → Generate a password for "Mail"
 * 3. Copy the 16-character app password into GMAIL_APP_PASSWORD in .env
 * 4. Set GMAIL_USER to your Gmail address
 *
 * Daily limit: ~500 emails/day (Gmail free). Sufficient for this platform.
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // 16-char Google App Password (NOT your login password)
  }
});

// Verify connection on startup in development
if (process.env.NODE_ENV === 'development') {
  transporter.verify().then(() => {
    console.log('[Mailer] Gmail SMTP connection verified');
  }).catch((err) => {
    console.warn('[Mailer] Gmail SMTP not configured yet:', err.message);
    console.warn('[Mailer] Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file');
  });
}

module.exports = transporter;
