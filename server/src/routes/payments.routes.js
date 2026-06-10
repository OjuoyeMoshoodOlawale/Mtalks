const router = require('express').Router();
const ctrl   = require('../controllers/payments.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimiter');

router.post('/initialize',            verifyToken, ctrl.initialize);
router.post('/initialize-guest',                      ctrl.initializeGuestEvent); // no auth
router.post('/webhook',    webhookLimiter, ctrl.webhook);
router.get('/',            verifyToken, requireAdmin, ctrl.getAll);
router.get('/my',          verifyToken, ctrl.getMine);

module.exports = router;
