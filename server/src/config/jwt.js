const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_SECRET       || 'mtalks_access_secret_change_in_prod';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mtalks_refresh_secret_change_in_prod';

const signAccess = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' });

const signRefresh = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' });

const verifyAccess = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefresh = (token) => jwt.verify(token, REFRESH_SECRET);

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
