/**
 * Nodemailer — cPanel SMTP (primary) → Gmail (fallback)
 *
 * All config reads from process.env (loaded by server.js via dotenv).
 * Values come from server/.env — see server/.env.example for reference.
 */
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

const GMAIL_USER = process.env.GMAIL_USER         || '';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';

/* ── Build transporters ── */
const cpanelTransporter = nodemailer.createTransport({
  host:   SMTP_HOST,
  port:   SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
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

let activeTransporter = cpanelTransporter;
let activeLabel       = `cPanel (${SMTP_USER})`;
let cpanelOk          = false;

/* ── Verify on startup ── */
if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn('[Mailer] ⚠️  cPanel SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing in .env)');
  if (GMAIL_USER && GMAIL_PASS) {
    activeTransporter = gmailTransporter;
    activeLabel       = `Gmail fallback (${GMAIL_USER})`;
    console.log('[Mailer] Using Gmail fallback');
  } else {
    console.error('[Mailer] ❌ No email transport configured — emails will fail');
  }
} else {
  cpanelTransporter.verify()
    .then(() => {
      cpanelOk = true;
      console.log('[Mailer] ✅ cPanel SMTP ready —', SMTP_USER);
    })
    .catch((err) => {
      console.error('[Mailer] ❌ cPanel SMTP failed:', err.message);
      if (GMAIL_USER && GMAIL_PASS) {
        gmailTransporter.verify()
          .then(() => {
            activeTransporter = gmailTransporter;
            activeLabel       = `Gmail fallback (${GMAIL_USER})`;
            console.log('[Mailer] ⚠️  Switched to Gmail fallback —', GMAIL_USER);
          })
          .catch(e => console.error('[Mailer] ❌ Gmail fallback also failed:', e.message));
      } else {
        console.error('[Mailer] ⚠️  No Gmail fallback — add GMAIL_USER + GMAIL_APP_PASSWORD to .env');
      }
    });
}

const mailer = {
  sendMail: async (mailOptions) => {
    try {
      return await activeTransporter.sendMail(mailOptions);
    } catch (err) {
      /* Mid-runtime cPanel failure — retry via Gmail */
      if (activeTransporter === cpanelTransporter && GMAIL_USER && GMAIL_PASS) {
        console.warn('[Mailer] cPanel failed mid-runtime, retrying via Gmail:', err.message);
        try {
          const result = await gmailTransporter.sendMail(mailOptions);
          activeTransporter = gmailTransporter;
          activeLabel       = `Gmail fallback (${GMAIL_USER})`;
          cpanelOk          = false;
          return result;
        } catch (gErr) {
          throw new Error(`Both transports failed. cPanel: ${err.message} | Gmail: ${gErr.message}`);
        }
      }
      throw err;
    }
  },
  getActiveUser:  () => (activeTransporter === cpanelTransporter ? SMTP_USER : GMAIL_USER),
  getActiveLabel: () => activeLabel,
};

module.exports = mailer;
