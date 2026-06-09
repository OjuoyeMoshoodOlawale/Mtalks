const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs:    15 * 60 * 1000,
  max:         10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' }
});

const generalLimiter = rateLimit({
  windowMs:    60 * 1000,
  max:         120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' }
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { success: false, message: 'Webhook rate limit exceeded.' }
});

module.exports = { authLimiter, generalLimiter, webhookLimiter };
