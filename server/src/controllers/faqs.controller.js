const db     = require('../config/db');
const { ok, created, badReq, notFound, serverErr, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM faqs');
    return ok(res, rows);
  } catch (err) {
    logger.error('faqs.getAll', { error: err.message, route: req.originalUrl });
    return serverErr(res);
  }
};

exports.create = async (req, res) => {
  return created(res, { message: 'faqs created (implement me)' });
};

exports.update = async (req, res) => {
  return ok(res, { message: 'faqs updated (implement me)' });
};

exports.remove = async (req, res) => {
  return ok(res, { message: 'faqs deleted (implement me)' });
};
