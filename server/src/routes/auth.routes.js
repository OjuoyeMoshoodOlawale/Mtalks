const router = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');

router.post('/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  ctrl.register
);

router.post('/verify-email',
  body('email').isEmail().normalizeEmail(),
  body('otp').notEmpty().withMessage('OTP is required'),
  validate,
  ctrl.verifyEmail
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  ctrl.login
);

router.post('/refresh',  ctrl.refresh);
router.post('/logout',   verifyToken, ctrl.logout);

router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validate,
  ctrl.forgotPassword
);

router.post('/reset-password',
  body('email').isEmail().normalizeEmail(),
  body('otp').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  ctrl.resetPassword
);

router.get('/me',              verifyToken, ctrl.getMe);
router.put('/update-profile',  verifyToken, ctrl.updateProfile);
router.put('/change-password', verifyToken, ctrl.changePassword);

module.exports = router;
