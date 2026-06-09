const router = require('express').Router();
const ctrl   = require('../controllers/enrollments.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',     verifyToken, requireAdmin, ctrl.getAll);
router.get('/my',   verifyToken, ctrl.getMine);
router.post('/',    verifyToken, ctrl.create);
router.delete('/:id', verifyToken, requireAdmin, ctrl.remove);
module.exports = router;
