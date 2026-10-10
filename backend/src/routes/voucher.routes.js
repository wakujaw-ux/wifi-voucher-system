const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { generateLimiter } = require('../middleware/rateLimit.middleware');

router.use(authenticate);

// Muhimu: /stats na /code/:code ziwe kabla ya /:id (kwanza)
router.get('/stats', voucherController.getStats);
router.get('/code/:code', voucherController.getByCode);

// Generate vouchers route (only for ADMIN and SUPER_ADMIN)
router.post('/generate', requireRole('ADMIN', 'SUPER_ADMIN'), generateLimiter, voucherController.generate);

//sell voucher route (only for ADMIN, SUPER_ADMIN and OPERATOR wote wanaweza kuuza voucher)
router.post('/:id/sell', requireRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), voucherController.sell);

// Revoke voucher route (only for ADMIN and SUPER_ADMIN)
router.post('/:id/revoke', requireRole('ADMIN', 'SUPER_ADMIN'), voucherController.revoke);

//Generic routes mwisho
router.get('/', voucherController.getAll);
router.get('/:id', voucherController.getOne);

module.exports = router;
