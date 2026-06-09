const router = require('express').Router();
const ctrl   = require('../controllers/settings.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',  verifyToken, requireAdmin, ctrl.getAll);
router.put('/',  verifyToken, requireAdmin, ctrl.update);
module.exports = router;
