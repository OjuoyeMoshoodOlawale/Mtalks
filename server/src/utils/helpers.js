const { v4: uuidv4 } = require('uuid');

/**
 * Standard API response shape
 */
const respond = (res, statusCode, success, dataOrMessage, meta = {}) => {
  if (success) {
    return res.status(statusCode).json({ success: true, data: dataOrMessage, ...meta });
  }
  return res.status(statusCode).json({ success: false, message: dataOrMessage });
};

const ok       = (res, data, meta)    => respond(res, 200, true,  data, meta);
const created  = (res, data)          => respond(res, 201, true,  data);
const badReq   = (res, msg)           => respond(res, 400, false, msg);
const unauth   = (res, msg = 'Unauthorized')    => respond(res, 401, false, msg);
const forbidden= (res, msg = 'Forbidden')       => respond(res, 403, false, msg);
const notFound = (res, msg = 'Not found')       => respond(res, 404, false, msg);
const conflict = (res, msg)           => respond(res, 409, false, msg);
const serverErr= (res, msg = 'Server error')    => respond(res, 500, false, msg);

/** Generate a unique ticket code */
const genTicketCode = () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16);

/** Generate a 6-digit OTP */
const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/** Paginate helper — returns { offset, limit, page, perPage } */
const paginate = (query) => {
  const page    = Math.max(1, parseInt(query.page)    || 1);
  const perPage = Math.min(100, parseInt(query.limit) || 20);
  return { page, perPage, offset: (page - 1) * perPage, limit: perPage };
};

module.exports = { ok, created, badReq, unauth, forbidden, notFound, conflict, serverErr, genTicketCode, genOtp, paginate };
