const router = require('express').Router();
const ctrl   = require('../controllers/settings.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Public — safe keys only (for Crisp widget ID etc.)
router.get('/public', ctrl.getPublic);

router.get('/',  verifyToken, requireAdmin, ctrl.getAll);
router.put('/',  verifyToken, requireAdmin, ctrl.update);
router.post('/test-email', verifyToken, requireAdmin, ctrl.testEmail);
module.exports = router;
