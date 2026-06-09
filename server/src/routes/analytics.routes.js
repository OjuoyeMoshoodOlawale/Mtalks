const router = require('express').Router();
const ctrl   = require('../controllers/analytics.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/overview', verifyToken, requireAdmin, ctrl.getAll);
router.get('/revenue',  verifyToken, requireAdmin, ctrl.getRevenue);
module.exports = router;
