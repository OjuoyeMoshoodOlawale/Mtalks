const bcrypt   = require('bcryptjs');
const db       = require('../config/db');
const { signAccess, signRefresh, verifyRefresh } = require('../config/jwt');
const { sendOtpEmail, sendWelcomeEmail } = require('../services/email.service');
const { ok, created, badReq, unauth, conflict, serverErr, genOtp } = require('../utils/helpers');
const logger   = require('../utils/logger');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',  // lax allows LAN/port-forwarding in dev
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
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    // Clear any previous unused OTPs for this user
    await db.query('DELETE FROM otp_tokens WHERE user_id = ? AND type = ?', [userId, 'verify_email']);
    await db.query(
      'INSERT INTO otp_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [userId, otp, 'verify_email', expiresAt]
    );

    /* Always log OTP to console in dev — Gmail may silently drop emails */
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n' + '='.repeat(44));
      console.log('  OTP CODE — ' + email.trim());
      console.log('  Code: ' + otp + '   (expires 30 min)');
      console.log('='.repeat(44) + '\n');
    }

    /* Send OTP email — non-blocking: registration succeeds even if email fails. */
    try {
      await sendOtpEmail({ to: email.trim().toLowerCase(), name: name.trim(), otp, type: 'verify_email' });
    } catch (mailErr) {
      logger.warn('register: OTP email failed — ' + mailErr.message);
    }

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
      'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND type = ? AND used = 0',
      [userId, otp, 'verify_email']
    );
    if (!tokens.length) return badReq(res, 'Invalid verification code');
    if (new Date(tokens[0].expires_at) < new Date())
      return badReq(res, 'Verification code has expired — please request a new one');

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
    if (!user.is_verified) {
      /* Auto-resend OTP so user doesn't have to hunt for the resend button */
      try {
        const otp       = genOtp();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await db.query('DELETE FROM otp_tokens WHERE user_id = ? AND type = ?', [user.id, 'verify_email']);
        await db.query(
          'INSERT INTO otp_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
          [user.id, otp, 'verify_email', expiresAt]
        );
        if (process.env.NODE_ENV !== 'production') {
          console.log('\n' + '='.repeat(44));
          console.log('  OTP (login — unverified) — ' + user.email);
          console.log('  Code: ' + otp + '   (expires 30 min)');
          console.log('='.repeat(44) + '\n');
        }
        sendOtpEmail({ to: user.email, name: user.name, otp, type: 'verify_email' }).catch(() => {});
      } catch (_) { /* non-blocking */ }

      /* Return 403 with machine-readable flag — frontend redirects to OTP screen */
      return res.status(403).json({
        success:          false,
        needsVerification: true,
        email:            user.email,
        message:          'Your email is not verified. A new code has been sent to ' + user.email + '.'
      });
    }

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


/* ── Resend OTP ── */
exports.resendOtp = async (req, res) => {
  const { email, type = 'verify_email' } = req.body;
  if (!email) return badReq(res, 'Email is required');
  try {
    const [users] = await db.query(
      'SELECT id, name, is_verified FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (!users.length) return badReq(res, 'No account found with that email');
    const user = users[0];
    if (type === 'verify_email' && user.is_verified)
      return badReq(res, 'This account is already verified. Please sign in.');

    const otp       = genOtp();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Invalidate old OTPs, then insert fresh one
    await db.query('DELETE FROM otp_tokens WHERE user_id = ? AND type = ?', [user.id, type]);
    await db.query(
      'INSERT INTO otp_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, otp, type, expiresAt]
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log('\n' + '='.repeat(44));
      console.log('  OTP CODE (resend) — ' + email.trim());
      console.log('  Code: ' + otp + '   (expires 30 min)');
      console.log('='.repeat(44) + '\n');
    }
    try {
      await sendOtpEmail({ to: email.toLowerCase().trim(), name: user.name, otp, type });
    } catch (mailErr) {
      logger.warn('resendOtp: email failed — ' + mailErr.message);
    }

    return ok(res, { message: 'A fresh verification code has been sent to your email.' });
  } catch (err) { return serverErr(res, err, 'Resend failed'); }
};

/* ── Forgot Password ── */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_RX.test(email.trim()))
    return badReq(res, 'Please enter a valid email address');

  const cleanEmail = email.toLowerCase().trim();

  try {
    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [cleanEmail]);
    /* Always return success — prevents user enumeration */
    if (!users.length) return ok(res, { message: 'If that email exists, a reset code was sent.' });

    const { id, name } = users[0];
    const otp       = genOtp();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    /* Clear any previous unused reset tokens — only one active at a time */
    await db.query('DELETE FROM otp_tokens WHERE user_id = ? AND type = ?', [id, 'reset_password']);
    await db.query(
      'INSERT INTO otp_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [id, otp, 'reset_password', expiresAt]
    );

    /* Always log in dev — mailer may not be working yet */
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n' + '='.repeat(44));
      console.log('  RESET OTP — ' + cleanEmail);
      console.log('  Code: ' + otp + '   (expires 30 min)');
      console.log('='.repeat(44) + '\n');
    }

    /* Non-blocking email — OTP is already in DB; mailer failure must not return 500 */
    try {
      await sendOtpEmail({ to: cleanEmail, name, otp, type: 'reset_password' });
    } catch (mailErr) {
      logger.warn('forgotPassword: email failed — ' + mailErr.message + ' (OTP saved to DB)');
    }

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
      'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND type = ? AND used = 0',
      [userId, otp, 'reset_password']
    );
    if (!tokens.length) return badReq(res, 'Invalid reset code');
    if (new Date(tokens[0].expires_at) < new Date())
      return badReq(res, 'Reset code has expired — please request a new one');

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
  } catch (err) { return serverErr(res, err, 'Server error');
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
