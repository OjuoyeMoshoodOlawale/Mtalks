const rateLimit = require('express-rate-limit');

/**
 * Skip rate limiting for authenticated requests (Bearer token present).
 * Admin users doing bulk uploads / frequent operations should never be blocked.
 * The rate limits mainly protect against unauthenticated bots and scrapers.
 */
const skipAuthenticated = (req) => {
  const auth = req.headers.authorization;
  return !!(auth && auth.startsWith('Bearer ') && auth.length > 20);
};

/* Strict: login/register/password endpoints — 5 per minute, unauthenticated only */
const authLimiter = rateLimit({
  windowMs:               60 * 1000,
  max:                    5,
  standardHeaders:        true,
  legacyHeaders:          false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts. Please wait 30 seconds and try again.' }
});

/* Session: refresh / me / logout — 60/min but never blocks authenticated admins */
const sessionLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipAuthenticated,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

/* General: all other API routes — 200/min, authenticated users are never throttled */
const generalLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             200,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipAuthenticated,   // ← admins bulk-uploading images never hit this
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' }
});

/* Webhook: Paystack callbacks */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      50,
  message:  { success: false, message: 'Webhook rate limit exceeded.' }
});

module.exports = { authLimiter, sessionLimiter, generalLimiter, webhookLimiter };
