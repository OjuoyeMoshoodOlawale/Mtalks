const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    = statusCode === 500 ? 'Internal server error' : err.message;

  logger.error(err.message, {
    stack:  err.stack,
    route:  req.originalUrl,
    method: req.method,
    userId: req.user?.id || null
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
