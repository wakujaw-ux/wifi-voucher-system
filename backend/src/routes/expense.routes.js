const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

// /summary lazima iwe kabla ya /:id
router.get('/summary', expenseController.getSummary);
router.get('/', expenseController.getAll);
router.get('/:id', expenseController.getOne);

// Kuunda/kubadilisha/kufuta - ADMIN na SUPER_ADMIN tu
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), expenseController.create);
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), expenseController.update);
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), expenseController.remove);

module.exports = router;