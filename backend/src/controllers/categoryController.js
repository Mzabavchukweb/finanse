const models = require('../models');
const { Category } = models;

// Public category retrieval
exports.getPublicCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'description', 'slug']
        });
        res.json(categories);
    } catch (error) {
        console.error('Error getting public categories:', error);
        res.status(500).json({ message: 'Server error while fetching categories' });
    }
};

// Admin CRUD
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(categories);
    } catch (error) {
        console.error('Error getting all categories:', error);
        res.status(500).json({ message: 'Server error while fetching categories' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, slug, isActive } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (!slug) {
            return res.status(400).json({ message: 'Slug is required' });
        }

        // Check if category with same slug exists
        const existingCategory = await Category.findOne({ where: { slug } });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this slug already exists' });
        }

        const category = await Category.create({
            name,
            description,
            slug,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Invalid data',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ message: 'Server error while creating category' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, description, slug, isActive } = req.body;
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // If slug is being changed, check if it's already taken
        if (slug && slug !== category.slug) {
            const existingCategory = await Category.findOne({ where: { slug } });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this slug already exists' });
            }
        }

        // Validate required fields
        if (name === '') {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }
        if (slug === '') {
            return res.status(400).json({ message: 'Slug cannot be empty' });
        }

        await category.update({
            name: name || category.name,
            description: description !== undefined ? description : category.description,
            slug: slug || category.slug,
            isActive: isActive !== undefined ? isActive : category.isActive
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Invalid data',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ message: 'Server error while updating category' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if category has any products
        const productCount = await category.countProducts();
        if (productCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete category with associated products'
            });
        }

        await category.destroy();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error while deleting category' });
    }
};
