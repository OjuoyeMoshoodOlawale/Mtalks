const router = require('express').Router();
const ctrl   = require('../controllers/logs.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',           verifyToken, requireAdmin, ctrl.getAll);
router.get('/:id',        verifyToken, requireAdmin, ctrl.getOne);
router.delete('/purge',   verifyToken, requireAdmin, ctrl.remove);
module.exports = router;
