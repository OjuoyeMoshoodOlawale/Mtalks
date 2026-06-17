/**
 * Nodemailer — cPanel primary, Gmail fallback
 *
 * On startup, mailer.js verifies the cPanel transporter.
 * If it fails (wrong password, port blocked, host unreachable),
 * it automatically switches to Gmail so emails keep flowing
 * and clients never notice.
 *
 * cPanel SSL/TLS facts:
 *  - Port 465 → secure: true  (implicit TLS — required for this port)
 *  - tls.rejectUnauthorized: false → cPanel shared hosts use a shared
 *    SSL cert for mail.* subdomains; Node.js rejects it without this
 *
 * Once .env is confirmed working, swap each const to process.env.X:
 *   const SMTP_HOST = process.env.SMTP_HOST;  etc.
 */
const nodemailer = require('nodemailer');

/* ── cPanel constants — swap to process.env.X once .env is confirmed ── */
const SMTP_HOST = 'mail.themuhsinahacademy.com';
const SMTP_PORT = 465;
const SMTP_USER = 'noreply@themuhsinahacademy.com';
const SMTP_PASS = 'REPLACE_WITH_EMAIL_PASSWORD'; // ← cPanel email account password

/* ── Gmail fallback constants — hardcoded while .env is being fixed ──
 * To get a Gmail App Password:
 *   1. Enable 2FA on the Google account
 *   2. Go to myaccount.google.com/apppasswords
 *   3. Create an app password for "Mail"
 *   4. Paste the 16-char password below (no spaces)
 * Swap to process.env.X once .env is confirmed working.
 */
const GMAIL_USER = 'REPLACE_WITH_GMAIL_ADDRESS';   // e.g. themuhsinahacademy@gmail.com
const GMAIL_PASS = 'REPLACE_WITH_GMAIL_APP_PASSWORD'; // 16-char app password from Google

/* ── Build transporters ── */
const cpanelTransporter = nodemailer.createTransport({
  host:   SMTP_HOST,
  port:   SMTP_PORT,
  secure: true, // MUST be true for port 465
  auth:   { user: SMTP_USER, pass: SMTP_PASS },
  tls:    { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
  connectionTimeout: 10000,
  greetingTimeout:   10000,
  socketTimeout:     15000,
});

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth:    { user: GMAIL_USER, pass: GMAIL_PASS },
});

/* ── Active transporter — starts as cPanel, falls back to Gmail ── */
let activeTransporter  = cpanelTransporter;
let activeLabel        = `cPanel (${SMTP_USER})`;
let cpanelOk           = false; // tracks live cPanel health

/* ── Verify on startup ── */
cpanelTransporter.verify()
  .then(() => {
    cpanelOk = true;
    console.log('[Mailer] ✅ cPanel SMTP ready —', SMTP_USER);
  })
  .catch((err) => {
    console.error('[Mailer] ❌ cPanel SMTP failed:', err.message);
    console.error('[Mailer] Causes: wrong password | port 465 blocked | host unreachable');

    if (GMAIL_USER && GMAIL_PASS) {
      gmailTransporter.verify()
        .then(() => {
          activeTransporter = gmailTransporter;
          activeLabel       = `Gmail fallback (${GMAIL_USER})`;
          console.log('[Mailer] ⚠️  Switched to Gmail fallback —', GMAIL_USER);
        })
        .catch((gErr) => {
          console.error('[Mailer] ❌ Gmail fallback also failed:', gErr.message);
          console.error('[Mailer] All emails will fail until SMTP is fixed');
        });
    } else {
      console.error('[Mailer] ⚠️  No Gmail fallback configured (GMAIL_USER / GMAIL_APP_PASSWORD not set)');
      console.error('[Mailer] All emails will fail until cPanel SMTP is fixed');
    }
  });

/**
 * sendMail — wraps the active transporter.
 * If cPanel was healthy at startup but fails mid-runtime,
 * automatically retries once on Gmail before throwing.
 */
const mailer = {
  sendMail: async (mailOptions) => {
    try {
      return await activeTransporter.sendMail(mailOptions);
    } catch (err) {
      /* Mid-runtime cPanel failure — try Gmail once if available */
      if (activeTransporter === cpanelTransporter && GMAIL_USER && GMAIL_PASS) {
        console.warn('[Mailer] cPanel send failed mid-runtime, retrying via Gmail —', err.message);
        try {
          const result = await gmailTransporter.sendMail(mailOptions);
          /* Permanently switch so subsequent mails don't keep failing */
          activeTransporter = gmailTransporter;
          activeLabel       = `Gmail fallback (${GMAIL_USER})`;
          cpanelOk          = false;
          console.warn('[Mailer] ⚠️  Permanently switched to Gmail fallback');
          return result;
        } catch (gErr) {
          throw new Error(`Both cPanel and Gmail failed. cPanel: ${err.message} | Gmail: ${gErr.message}`);
        }
      }
      throw err;
    }
  },

  /* Expose for email.service.js to read (used in MAIL_FROM) */
  getActiveUser: () => (activeTransporter === cpanelTransporter ? SMTP_USER : GMAIL_USER),
  getActiveLabel: () => activeLabel,
};

module.exports = mailer;
