const db     = require('../config/db');
const { ok, created, badReq, notFound, serverErr, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM logs');
    return ok(res, rows);
  } catch (err) {
    logger.error('logs.getAll', { error: err.message, route: req.originalUrl });
    return serverErr(res);
  }
};

exports.create = async (req, res) => {
  return created(res, { message: 'logs created (implement me)' });
};

exports.update = async (req, res) => {
  return ok(res, { message: 'logs updated (implement me)' });
};

exports.remove = async (req, res) => {
  return ok(res, { message: 'logs deleted (implement me)' });
};
