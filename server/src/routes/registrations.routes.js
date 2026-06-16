const router = require('express').Router();
const ctrl   = require('../controllers/registrations.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',              verifyToken, requireAdmin, ctrl.getAll);
router.get('/my',            verifyToken, ctrl.getMine);
router.post('/',             verifyToken, ctrl.create);
router.patch('/:id/checkin', verifyToken, requireAdmin, ctrl.checkIn);
router.get('/export-csv', verifyToken, requireAdmin, ctrl.exportCsv);
module.exports = router;
