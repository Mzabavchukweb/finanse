const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'images/products/' });
const { createProductValidation, updateProductValidation } = require('../validators/productValidator');
const { validationResult } = require('express-validator');

// Publiczne endpointy - dostępne dla wszystkich
router.get('/public', productController.getPublicProducts);
router.get('/public/:id', productController.getPublicProductById);

// Chronione endpointy - wymagają logowania
router.get('/', authMiddleware.protect, productController.getAllProducts);
router.get('/:id', authMiddleware.protect, productController.getProductById);

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

// Endpointy administracyjne - wymagają roli admin
router.post('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), createProductValidation, handleValidationErrors, productController.createProduct);
router.put('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), updateProductValidation, handleValidationErrors, productController.updateProduct);
router.delete('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), productController.deleteProduct);
router.post('/:id/image', authMiddleware.protect, authMiddleware.restrictTo('admin'), upload.single('image'), productController.uploadImage);

module.exports = router;
