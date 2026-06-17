const router = require('express').Router();
const ctrl   = require('../controllers/payments.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimiter');

router.post('/initialize',       verifyToken,  ctrl.initialize);
router.post('/initialize-guest',               ctrl.initializeGuestEvent);

/* Standard Paystack verify — called after popup success or Paystack redirect */
router.get('/verify',                          ctrl.verifyPayment);   // Paystack callback_url redirect
router.post('/verify',                         ctrl.verifyPayment);   // inline popup callback

/* Backward compat aliases */
router.post('/confirm',                        ctrl.confirmPayment);
router.post('/confirm-guest',                  ctrl.confirmGuestPayment);

router.post('/webhook',  webhookLimiter,       ctrl.webhook);
router.get('/',          verifyToken, requireAdmin, ctrl.getAll);
router.get('/my',        verifyToken,          ctrl.getMine);

module.exports = router;
