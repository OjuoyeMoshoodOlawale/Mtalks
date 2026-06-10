const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const hpp     = require('hpp');
const morgan  = require('morgan');
const xssClean = require('xss-clean');

const { authLimiter, sessionLimiter, generalLimiter, webhookLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

/* ── Security ── */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://muhsinahacademy.com',
    'https://www.muhsinahacademy.com'
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
}));
app.use(hpp());
app.use(xssClean());

/* ── Body parsing ── */
// Raw body needed for Paystack webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ── HTTP logging ── */
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

/* ── Rate limiting ── */
/* ── Rate limiting — targeted per route type ──
 * Only login/register/password routes get the strict limiter.
 * Session calls (me, refresh, logout) get a generous limit to avoid
 * locking out users during normal browsing.
 */
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/register',        authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password',  authLimiter);
app.use('/api/auth/verify-email',    authLimiter);
app.use('/api/auth',                 sessionLimiter);   // me, refresh, logout
app.use('/api',                      generalLimiter);   // everything else

/* ── Routes ── */
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/courses',        require('./routes/courses.routes'));
app.use('/api/modules',        require('./routes/modules.routes'));
app.use('/api/lessons',        require('./routes/lessons.routes'));
app.use('/api/enrollments',    require('./routes/enrollments.routes'));
app.use('/api/events',         require('./routes/events.routes'));
app.use('/api/registrations',  require('./routes/registrations.routes'));
app.use('/api/payments',       require('./routes/payments.routes'));
app.use('/api/users',          require('./routes/users.routes'));
app.use('/api/team',           require('./routes/team.routes'));
app.use('/api/testimonials',   require('./routes/testimonials.routes'));
app.use('/api/faqs',           require('./routes/faqs.routes'));
app.use('/api/settings',       require('./routes/settings.routes'));
app.use('/api/analytics',      require('./routes/analytics.routes'));
app.use('/api/logs',           require('./routes/logs.routes'));
app.use('/api/contacts',       require('./routes/contacts.routes'));
app.use('/api/evaluations',    require('./routes/evaluations.routes'));
app.use('/api/certificates',   require('./routes/certificates.routes'));
app.use('/api/bot',            require('./routes/bot.routes'));
app.use('/api/gallery',        require('./routes/gallery.routes'));

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  const sk = process.env.PAYSTACK_SECRET_KEY || '';
  res.json({
    success:  true,
    message:  'MTalks API is healthy',
    env:      process.env.NODE_ENV,
    services: {
      database: 'connected',
      paystack: sk && !sk.includes('xxxx') ? 'configured ✓' : '⚠️  PAYSTACK_SECRET_KEY not set',
      email:    process.env.GMAIL_USER ? 'configured ✓' : '⚠️  GMAIL_USER not set',
    }
  });
});

/* ── 404 ── */
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

/* ── Global error handler ── */
app.use(errorHandler);

module.exports = app;
