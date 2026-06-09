const { verifyAccess } = require('../config/jwt');
const { unauth, forbidden } = require('../utils/helpers');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauth(res, 'No token provided');
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccess(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauth(res, 'Token expired');
    return unauth(res, 'Invalid token');
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return forbidden(res, 'Admin access required');
  }
  next();
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyAccess(authHeader.split(' ')[1]);
    } catch (_) {}
  }
  next();
};

module.exports = { verifyToken, requireAdmin, optionalAuth };
