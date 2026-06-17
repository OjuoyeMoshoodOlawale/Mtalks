/**
 * Nodemailer — cPanel SMTP
 *
 * Settings hardcoded as constants for debugging.
 * Once .env loading is confirmed working, swap each const to:
 *   const SMTP_HOST = process.env.SMTP_HOST;  etc.
 *
 * cPanel SSL/TLS facts (from Nodemailer docs):
 *  - Port 465 → secure: true  (implicit TLS from first byte — required)
 *  - Port 587 → secure: false (STARTTLS upgrade after handshake)
 *  - tls.rejectUnauthorized: false → needed on shared cPanel hosts
 *    because they use a shared SSL cert for mail.* subdomains
 */
const nodemailer = require('nodemailer');

/* ── SMTP constants — swap to process.env.X once .env is confirmed ── */
const SMTP_HOST   = 'mail.themuhsinahacademy.com';
const SMTP_PORT   = 465;
const SMTP_SECURE = true;                          // MUST be true for port 465
const SMTP_USER   = 'noreply@themuhsinahacademy.com';
const SMTP_PASS   = 'REPLACE_WITH_EMAIL_PASSWORD'; // ← put the cPanel email password here

const transporter = nodemailer.createTransport({
  host:   SMTP_HOST,
  port:   SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // cPanel shared SSL cert — keep false
    minVersion: 'TLSv1.2',
  },
  connectionTimeout: 10000,  // 10s — cPanel shared hosts can be slow
  greetingTimeout:   10000,
  socketTimeout:     15000,
});

transporter.verify()
  .then(() => {
    console.log('[Mailer] ✅ SMTP ready — sending from:', SMTP_USER);
  })
  .catch((err) => {
    console.error('\n[Mailer] ❌ SMTP FAILED:', err.message);
    console.error('[Mailer] Host:', SMTP_HOST, '| Port:', SMTP_PORT, '| User:', SMTP_USER);
    console.error('[Mailer] Common causes:');
    console.error('  1. Wrong password — check cPanel → Email Accounts');
    console.error('  2. Port 465 blocked by host firewall — try port 587 with secure:false');
    console.error('  3. SMTP_USER must exactly match the cPanel email address\n');
  });

module.exports = transporter;
