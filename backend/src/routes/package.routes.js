const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// Routes zote zinahitaji authentication
router.use(authenticate);

//GET /api/packages - Orodha ya packages
router.get('/', packageController.getAll);

//GET /api/packages/:id - package moja
router.get('/:id', packageController.getOne)

//POST /api/packages - Unda package (ADMIN AU SUPER_ADMIN tu)
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), packageController.create);

// PUT /api/packages/: id - Update package
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), packageController.update);

// DELETE /api/packages/:id - Futa package
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), packageController.remove);

module.exports = router;