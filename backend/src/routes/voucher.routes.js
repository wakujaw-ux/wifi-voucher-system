const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

// Muhimu: /stats na /code/:code ziwe kabla ya /:id
router.get('/stats', voucherController.getStats);
router.get('/code/:code', voucherController.getByCode);

router.get('/', voucherController.getAll);
router.get('/:id', voucherController.getOne);

router.post('/generate', requireRole('ADMIN', 'SUPER_ADMIN'), voucherController.generate);

module.exports = router;
