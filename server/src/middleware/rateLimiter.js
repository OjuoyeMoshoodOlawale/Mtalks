const rateLimit = require('express-rate-limit');

const skipAuthenticated = (req) => {
  const auth = req.headers.authorization;
  return !!(auth && auth.startsWith('Bearer ') && auth.length > 20);
};

const authLimiter = rateLimit({
  windowMs:               15 * 60 * 1000,   // 15-min window
  max:                    2000,              // 2000 attempts per window
  standardHeaders:        true,
  legacyHeaders:          false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts. Please try again shortly.' }
});

const sessionLimiter = rateLimit({
  windowMs: 60 * 1000, max: 2000, standardHeaders: true, legacyHeaders: false,
  skip: skipAuthenticated,
  message: { success: false, message: 'Too many requests.' }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 2000, standardHeaders: true, legacyHeaders: false,
  skip: skipAuthenticated,
  message: { success: false, message: 'Rate limit exceeded.' }
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, max: 500,
  message: { success: false, message: 'Webhook rate limit exceeded.' }
});

module.exports = { authLimiter, sessionLimiter, generalLimiter, webhookLimiter };
