const router = require('express').Router();
const ctrl   = require('../controllers/users.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',               verifyToken, requireAdmin, ctrl.getAll);
router.get('/:id',            verifyToken, requireAdmin, ctrl.getOne);
router.put('/:id/role',       verifyToken, requireAdmin, ctrl.updateRole);
router.put('/:id/toggle',     verifyToken, requireAdmin, ctrl.toggleActive);
module.exports = router;
