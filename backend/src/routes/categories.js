const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory, getPublicCategories } = require('../controllers/categoryController');
const { protect, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/public', getPublicCategories);

// Admin routes - require authentication and admin role
router.use(protect); // All routes below require authentication
router.use(requireAdmin); // All routes below require admin role

// Get all categories (admin)
router.get('/', getAllCategories);

// Create new category (admin)
router.post('/', createCategory);

// Update category (admin)
router.put('/:id', updateCategory);

// Delete category (admin)
router.delete('/:id', deleteCategory);

module.exports = router;
