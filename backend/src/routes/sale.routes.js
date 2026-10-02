const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// /summary lazima iwe kabla ya /:id
router.get('/summary', saleController.getSummary);
router.get('/', saleController.getAll);
router.get('/:id', saleController.getOne);

module.exports = router;