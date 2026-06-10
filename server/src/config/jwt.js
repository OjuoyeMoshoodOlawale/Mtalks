const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/* SECURITY: refuse to run in production without real secrets.
 * In dev/test, fall back to throwaway values so local setup stays easy. */
if (process.env.NODE_ENV === 'production' && (!ACCESS_SECRET || !REFRESH_SECRET)) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in production. Generate with: openssl rand -hex 64');
  process.exit(1);
}
const A = ACCESS_SECRET  || 'dev_only_access_secret_do_not_use_in_prod';
const R = REFRESH_SECRET || 'dev_only_refresh_secret_do_not_use_in_prod';

const signAccess = (payload) =>
  jwt.sign(payload, A, { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' });

const signRefresh = (payload) =>
  jwt.sign(payload, R, { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' });

const verifyAccess  = (token) => jwt.verify(token, A);
const verifyRefresh = (token) => jwt.verify(token, R);

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
