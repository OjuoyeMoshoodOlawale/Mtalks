const rateLimit = require('express-rate-limit');

/* Strict: only for login/register/password endpoints — 5 attempts per minute */
const authLimiter = rateLimit({
  windowMs:        60 * 1000,      // 1 minute window
  max:             5,              // 5 attempts per window
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,    // successful logins don't count toward limit
  message: { success: false, message: 'Too many attempts. Please wait 30 seconds and try again.' }
});

/* Medium: for refresh/me/logout — authenticated session calls */
const sessionLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,             // 60 per minute (plenty for normal use)
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' }
});

/* General: all other API routes */
const generalLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' }
});

/* Webhook: Paystack callbacks */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      50,
  message:  { success: false, message: 'Webhook rate limit exceeded.' }
});

module.exports = { authLimiter, sessionLimiter, generalLimiter, webhookLimiter };
