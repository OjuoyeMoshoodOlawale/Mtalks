const router = require('express').Router();
const ctrl   = require('../controllers/sync.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const admin = [verifyToken, requireAdmin];

router.get('/status',          ...admin, ctrl.getStatus);
router.get('/settings',        ...admin, ctrl.getSettings);
router.put('/settings',        ...admin, ctrl.saveSettings);
router.post('/run',            ...admin, ctrl.triggerSync);
router.post('/test-connection',...admin, ctrl.testConnection);
router.post('/reset',          ...admin, ctrl.resetSync);
router.get('/logs',            ...admin, ctrl.getLogs);
router.get('/tables',          ...admin, ctrl.getTableStats);

module.exports = router;
