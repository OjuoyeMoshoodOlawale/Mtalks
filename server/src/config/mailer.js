/**
 * Nodemailer — Gmail SMTP
 * 
 * Required in server/.env:
 *   GMAIL_USER=themuhsinahacademy@gmail.com
 *   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop   ← 16-char Google App Password (spaces OK)
 *
 * Important: GMAIL_APP_PASSWORD is NOT your Gmail login password.
 * Generate at: Google Account → Security → 2-Step Verification → App Passwords
 */
const nodemailer = require('nodemailer');

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

if (!user || !pass) {
  console.warn('[Mailer] GMAIL_USER or GMAIL_APP_PASSWORD not set — emails will fail silently');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass }
});

/* Verify on startup and print clear status */
transporter.verify()
  .then(() => {
    console.log('[Mailer] Gmail SMTP ready — sending from:', user);
  })
  .catch((err) => {
    console.error('\n[Mailer] Gmail SMTP FAILED:', err.message);
    console.error('[Mailer] GMAIL_USER:', user || 'NOT SET');
    console.error('[Mailer] GMAIL_APP_PASSWORD length:', (pass || '').replace(/\s/g,'').length, 'chars (should be 16)');
    console.error('[Mailer] Fix: Google Account → Security → 2-Step Verification → App Passwords\n');
  });

module.exports = transporter;
