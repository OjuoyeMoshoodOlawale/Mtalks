const rateLimit = require('express-rate-limit');

const skipAuthenticated = (req) => {
  const auth = req.headers.authorization;
  return !!(auth && auth.startsWith('Bearer ') && auth.length > 20);
};

/* Login / register / password — 20 per 5 minutes (was 5/min — far too strict) */
const authLimiter = rateLimit({
  windowMs:               5 * 60 * 1000,   // 5-minute window
  max:                    20,               // 20 attempts per 5 minutes
  standardHeaders:        true,
  legacyHeaders:          false,
  skipSuccessfulRequests: true,             // successful logins don't count
  message: { success: false, message: 'Too many attempts. Please wait a few minutes.' }
});

/* Session calls (me / refresh / logout) — generous, skip if authenticated */
const sessionLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipAuthenticated,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

/* General API — 500/min, authenticated users always skip */
const generalLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             500,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipAuthenticated,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' }
});

/* Webhook only */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Webhook rate limit exceeded.' }
});

module.exports = { authLimiter, sessionLimiter, generalLimiter, webhookLimiter };
