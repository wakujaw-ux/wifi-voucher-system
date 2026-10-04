const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

//Routes maalum zina anza
router.get('/active', sessionController.getActive);
router.get('/stats', sessionController.getStats);

// Expire stale (ADMIN tu)
router.post('/expire-stale', requireRole('ADMIN', 'SUPER_ADMIN'), sessionController.expireStale);

// Disconnect (ADMIN au OPERATOR)
router.post('/:id/disconnect', requireRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), sessionController.disconnect);

// Generic routes mwisho
router.get('/', sessionController.getAll);
router.get('/:id', sessionController.getOne);

module.exports = router;