const models = require('../models');
const { Category } = models;

// Public category retrieval
exports.getPublicCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'description']
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
        const { name, description, isActive } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Check if category with same name exists
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        const category = await Category.create({
            name,
            description,
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
        const { name, description, isActive } = req.body;
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // If name is being changed, check if it's already taken
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ where: { name } });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
        }

        // Validate required fields
        if (name === '') {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }

        await category.update({
            name: name || category.name,
            description: description !== undefined ? description : category.description,
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

        // Ustaw categoryId na null dla wszystkich produktów z tą kategorią
        const { Product } = require('../models');
        await Product.update(
            { categoryId: null },
            { where: { categoryId: category.id } }
        );

        await category.destroy();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error while deleting category' });
    }
};
