/**
 * Rate limiting middleware
 *
 * express-rate-limit v5 API (Node 10 compatible fallback).
 * Once cPanel is running Node 18+, upgrade to v7:
 *   npm install express-rate-limit@latest
 * and restore standardHeaders/legacyHeaders options.
 */
const rateLimit = require('express-rate-limit');

const skipAuthenticated = (req) => {
  const auth = req.headers.authorization;
  return !!(auth && auth.startsWith('Bearer ') && auth.length > 20);
};

exports.authLimiter = rateLimit({
  windowMs:               15 * 60 * 1000,
  max:                    2000,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts. Please try again shortly.' }
});

exports.sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      2000,
  skip:     skipAuthenticated,
  message:  { success: false, message: 'Too many requests.' }
});

exports.generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      2000,
  skip:     skipAuthenticated,
  message:  { success: false, message: 'Rate limit exceeded.' }
});

exports.webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      500,
  message:  { success: false, message: 'Webhook rate limit exceeded.' }
});
