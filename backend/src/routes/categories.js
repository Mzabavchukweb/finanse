const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

// Publiczne pobieranie kategorii
router.get('/public', categoryController.getPublicCategories);

// Admin CRUD
router.get('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), categoryController.getAllCategories);
router.post('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), categoryController.createCategory);
router.put('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), categoryController.updateCategory);
router.delete('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), categoryController.deleteCategory);

module.exports = router;
