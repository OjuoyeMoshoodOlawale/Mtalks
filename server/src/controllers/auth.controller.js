const bcrypt   = require('bcryptjs');
const db       = require('../config/db');
const { signAccess, signRefresh, verifyRefresh } = require('../config/jwt');
const { sendOtpEmail, sendWelcomeEmail } = require('../services/email.service');
const { ok, created, badReq, unauth, conflict, serverErr, genOtp } = require('../utils/helpers');
const logger   = require('../utils/logger');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000
};

/* ── Register ── */
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  /* Input validation */
  if (!name || !name.trim() || name.trim().length < 2)
    return badReq(res, 'Please enter your full name');
  if (!email || !EMAIL_RX.test(email.trim()))
    return badReq(res, 'Please enter a valid email address');
  if (!password || password.length < 8)
    return badReq(res, 'Password must be at least 8 characters');
  if (name.trim().length > 100 || email.trim().length > 150)
    return badReq(res, 'Input too long');

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return conflict(res, 'An account with this email already exists');

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hash]
    );
    const userId = result.insertId;

    const otp = genOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.query(
      'INSERT INTO otp_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [userId, otp, 'verify_email', expiresAt]
    );

    await sendOtpEmail({ to: email, name: name.trim(), otp, type: 'verify_email' });

    return created(res, { message: 'Account created. Check your email for your verification code.' });
  } catch (err) {
    logger.error('register error', { error: err.message, route: '/auth/register' });
    return serverErr(res);
  }
};

/* ── Verify Email ── */
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!users.length) return badReq(res, 'Account not found');

    const userId = users[0].id;
    const [tokens] = await db.query(
      'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND type = ? AND used = 0 AND expires_at > NOW()',
      [userId, otp, 'verify_email']
    );
    if (!tokens.length) return badReq(res, 'Invalid or expired verification code');

    await db.query('UPDATE users SET is_verified = 1 WHERE id = ?', [userId]);
    await db.query('UPDATE otp_tokens SET used = 1 WHERE id = ?', [tokens[0].id]);

    const [updatedUser] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    const user = updatedUser[0];
    await sendWelcomeEmail({ to: user.email, name: user.name });

    const accessToken  = signAccess({ id: user.id, role: user.role });
    const refreshToken = signRefresh({ id: user.id, role: user.role });
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

    return ok(res, { accessToken, user });
  } catch (err) {
    logger.error('verifyEmail error', { error: err.message, route: '/auth/verify-email' });
    return serverErr(res);
  }
};

/* ── Login ── */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query(
      'SELECT id, name, email, password, role, is_verified, is_active FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (!users.length) return unauth(res, 'Invalid email or password');

    const user = users[0];
    if (!user.is_active)   return unauth(res, 'Account has been disabled. Contact support.');
    if (!user.is_verified) return unauth(res, 'Please verify your email before logging in.');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return unauth(res, 'Invalid email or password');

    const payload       = { id: user.id, role: user.role };
    const accessToken   = signAccess(payload);
    const refreshToken  = signRefresh(payload);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

    const { password: _, ...safeUser } = user;
    return ok(res, { accessToken, user: safeUser });
  } catch (err) {
    logger.error('login error', { error: err.message, route: '/auth/login' });
    return serverErr(res);
  }
};

/* ── Refresh Token ── */
exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return unauth(res, 'No refresh token');
  try {
    const decoded = verifyRefresh(token);
    const [users] = await db.query('SELECT id, role, is_active FROM users WHERE id = ?', [decoded.id]);
    if (!users.length || !users[0].is_active) return unauth(res, 'Account not found');

    const accessToken = signAccess({ id: decoded.id, role: decoded.role });
    return ok(res, { accessToken });
  } catch (_) {
    return unauth(res, 'Invalid or expired session. Please log in again.');
  }
};

/* ── Logout ── */
exports.logout = (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  return ok(res, { message: 'Logged out successfully' });
};

/* ── Forgot Password ── */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email.toLowerCase()]);
    // Always return success to avoid user enumeration
    if (!users.length) return ok(res, { message: 'If that email exists, a reset code was sent.' });

    const { id, name } = users[0];
    const otp       = genOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      'INSERT INTO otp_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [id, otp, 'reset_password', expiresAt]
    );
    await sendOtpEmail({ to: email, name, otp, type: 'reset_password' });

    return ok(res, { message: 'If that email exists, a reset code was sent.' });
  } catch (err) {
    logger.error('forgotPassword error', { error: err.message });
    return serverErr(res);
  }
};

/* ── Reset Password ── */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!users.length) return badReq(res, 'Account not found');

    const userId = users[0].id;
    const [tokens] = await db.query(
      'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND type = ? AND used = 0 AND expires_at > NOW()',
      [userId, otp, 'reset_password']
    );
    if (!tokens.length) return badReq(res, 'Invalid or expired reset code');

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    await db.query('UPDATE otp_tokens SET used = 1 WHERE id = ?', [tokens[0].id]);

    return ok(res, { message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    logger.error('resetPassword error', { error: err.message });
    return serverErr(res);
  }
};

/* ── Get My Profile ── */
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!users.length) return unauth(res, 'Account not found');
    return ok(res, users[0]);
  } catch (err) {
    return serverErr(res);
  }
};

/* ── Update My Profile ── */
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || !name.trim()) return badReq(res, 'Name is required');

    await db.query(
      'UPDATE users SET name = ?, avatar = ? WHERE id = ?',
      [name.trim(), avatar || null, req.user.id]
    );
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return ok(res, { message: 'Profile updated', user: rows[0] });
  } catch (err) {
    logger.error('updateProfile error', { error: err.message });
    return serverErr(res);
  }
};

/* ── Change Password ── */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return badReq(res, 'Current and new password are required');
    if (newPassword.length < 8)
      return badReq(res, 'New password must be at least 8 characters');

    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?', [req.user.id]
    );
    if (!users.length) return unauth(res, 'Account not found');

    const match = await bcrypt.compare(currentPassword, users[0].password);
    if (!match) return badReq(res, 'Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

    return ok(res, { message: 'Password changed successfully' });
  } catch (err) {
    logger.error('changePassword error', { error: err.message });
    return serverErr(res);
  }
};
