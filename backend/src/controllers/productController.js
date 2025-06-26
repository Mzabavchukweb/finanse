const { Product, Category } = require('../models');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const multer = require('multer');
const { Op } = require('sequelize');

// Storage configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/products');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get all products with filtering and pagination
exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const status = req.query.status || '';
        const featured = req.query.featured || '';

        const whereClause = {};
        
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { sku: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (category) whereClause.categoryId = category;
        if (status === 'active') whereClause.isActive = true;
        if (status === 'inactive') whereClause.isActive = false;
        if (featured === 'true') whereClause.isFeatured = true;

        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            products,
            pagination: {
                total: count,
                page,
                pages: Math.ceil(count / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get single product
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }]
        });
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }
        
        res.json({ success: true, product });
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        const {
            name, description, price,
            stock, sku, brand, categoryId, isActive, isFeatured
        } = req.body;

        // Validation
        if (!name || !price || !categoryId || !sku) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, category, and SKU are required'
            });
        }

        // Check if category exists
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ where: { sku } });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists'
            });
        }

        const product = await Product.create({
            name, description, price,
            stock: stock || 0, sku, brand, categoryId,
            isActive: isActive !== undefined ? isActive : true,
            isFeatured: isFeatured || false
        });

        const productWithCategory = await Product.findByPk(product.id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }]
        });

        res.status(201).json({ 
            success: true, 
            message: 'Product created successfully',
            product: productWithCategory 
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        // If categoryId is being updated, check if it exists
        if (req.body.categoryId) {
            const category = await Category.findByPk(req.body.categoryId);
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Category not found'
                });
            }
        }

        // Check if SKU is being updated and already exists
        if (req.body.sku && req.body.sku !== product.sku) {
            const existingProduct = await Product.findOne({ 
                where: { 
                    sku: req.body.sku,
                    id: { [Op.ne]: req.params.id }
                } 
            });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this SKU already exists'
                });
            }
        }

        await product.update(req.body);

        const updatedProduct = await Product.findByPk(product.id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }]
        });

        res.json({ 
            success: true, 
            message: 'Product updated successfully',
            product: updatedProduct 
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        // Delete product images
        if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
                const imagePath = path.join(__dirname, '../../uploads/products', path.basename(image));
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }

        await product.destroy();

        res.json({ 
            success: true, 
            message: 'Product deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Bulk operations
exports.bulkUpdate = async (req, res) => {
    try {
        const { productIds, updates } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs are required'
            });
        }

        await Product.update(updates, {
            where: { id: { [Op.in]: productIds } }
        });

        res.json({ 
            success: true, 
            message: `${productIds.length} products updated successfully` 
        });
    } catch (error) {
        console.error('Error bulk updating products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

exports.bulkDelete = async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs are required'
            });
        }

        const deletedCount = await Product.destroy({
            where: { id: { [Op.in]: productIds } }
        });

        res.json({ 
            success: true, 
            message: `${deletedCount} products deleted successfully` 
        });
    } catch (error) {
        console.error('Error bulk deleting products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// CSV Import
exports.importCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        const results = [];
        const errors = [];
        let lineNumber = 1;

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', async (data) => {
                lineNumber++;
                try {
                    // Required fields validation
                    if (!data.name || !data.price || !data.sku) {
                        errors.push(`Line ${lineNumber}: Name, price, and SKU are required`);
                        return;
                    }

                    // Check if SKU already exists
                    const existingProduct = await Product.findOne({ where: { sku: data.sku } });
                    if (existingProduct) {
                        errors.push(`Line ${lineNumber}: SKU ${data.sku} already exists`);
                        return;
                    }

                    // Find or create category
                    let categoryId = data.categoryId;
                    if (data.categoryName && !categoryId) {
                        const [category] = await Category.findOrCreate({
                            where: { name: data.categoryName },
                            defaults: { name: data.categoryName, description: '' }
                        });
                        categoryId = category.id;
                    }

                    const productData = {
                        name: data.name,
                        description: data.description,
                        price: parseFloat(data.price),
                        stock: parseInt(data.stock) || 0,
                        sku: data.sku,
                        brand: data.brand,
                        categoryId: categoryId || 1, // Default category
                        isActive: data.isActive !== 'false',
                        isFeatured: data.isFeatured === 'true'
                    };

                    const product = await Product.create(productData);
                    results.push(product);
                } catch (error) {
                    errors.push(`Line ${lineNumber}: ${error.message}`);
                }
            })
            .on('end', () => {
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);

                res.json({
                    success: true,
                    message: `Import completed. ${results.length} products imported successfully`,
                    imported: results.length,
                    errors: errors
                });
            });
    } catch (error) {
        console.error('Error importing CSV:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Image upload
exports.uploadImages = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images uploaded'
            });
        }

        const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
        const updatedImages = [...(product.images || []), ...imageUrls];

        await product.update({ 
            images: updatedImages,
            imageUrl: updatedImages[0] // Set first image as main image
        });

        res.json({ 
            success: true, 
            message: 'Images uploaded successfully',
            images: imageUrls 
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Delete image
exports.deleteImage = async (req, res) => {
    try {
        const { productId, imageUrl } = req.params;
        const product = await Product.findByPk(productId);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        const updatedImages = (product.images || []).filter(img => img !== imageUrl);
        
        // Delete physical file
        const imagePath = path.join(__dirname, '../../uploads/products', path.basename(imageUrl));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await product.update({ 
            images: updatedImages,
            imageUrl: updatedImages.length > 0 ? updatedImages[0] : null
        });

        res.json({ 
            success: true, 
            message: 'Image deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Public endpoints
exports.getPublicProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const category = req.query.category || '';
        const search = req.query.search || '';
        const featured = req.query.featured || '';
        const minPrice = req.query.minPrice || 0;
        const maxPrice = req.query.maxPrice || 999999;

        const whereClause = { isActive: true };
        
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (category) whereClause.categoryId = category;
        if (featured === 'true') whereClause.isFeatured = true;
        
        whereClause.price = { [Op.between]: [minPrice, maxPrice] };

        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            products,
            pagination: {
                total: count,
                page,
                pages: Math.ceil(count / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error getting public products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

exports.getPublicProductById = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { id: req.params.id, isActive: true },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }]
        });
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }
        
        res.json({ success: true, product });
    } catch (error) {
        console.error('Error getting public product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Export multer upload middleware
exports.upload = upload;
