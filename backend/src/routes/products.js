const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for CSV upload
const csvUpload = multer({ 
    dest: 'uploads/csv/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Public routes (no authentication required)
router.get('/public', productController.getPublicProducts);
router.get('/public/:id', productController.getPublicProductById);

// Admin routes (authentication required)
router.use(protect); // All routes below require authentication
router.use(restrictTo('admin')); // All routes below require admin role

// Product CRUD
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Bulk operations
router.post('/bulk/update', productController.bulkUpdate);
router.post('/bulk/delete', productController.bulkDelete);

// CSV Import/Export
router.post('/import/csv', csvUpload.single('csvFile'), productController.importCSV);

// Image management
router.post('/:id/images', 
    productController.upload.array('images', 10), 
    productController.uploadImages
);
router.delete('/:productId/images/:imageUrl', productController.deleteImage);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 images.'
            });
        }
    }
    
    if (error.message === 'Only image files are allowed' || 
        error.message === 'Only CSV files are allowed') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
});

module.exports = router;
