const router = require('express').Router();
const ctrl   = require('../controllers/registrations.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',    verifyToken, requireAdmin, ctrl.getAll);
router.get('/my',  verifyToken, ctrl.getMine);
router.post('/',   verifyToken, ctrl.create);
module.exports = router;
