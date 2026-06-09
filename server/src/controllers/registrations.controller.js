const db     = require('../config/db');
const { ok, created, badReq, notFound, serverErr, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM registrations');
    return ok(res, rows);
  } catch (err) {
    logger.error('registrations.getAll', { error: err.message, route: req.originalUrl });
    return serverErr(res);
  }
};

exports.create = async (req, res) => {
  return created(res, { message: 'registrations created (implement me)' });
};

exports.update = async (req, res) => {
  return ok(res, { message: 'registrations updated (implement me)' });
};

exports.remove = async (req, res) => {
  return ok(res, { message: 'registrations deleted (implement me)' });
};
