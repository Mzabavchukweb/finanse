const Product = require('../models/Product');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');

// Publiczny endpoint - lista produktów
exports.getPublicProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { isActive: true },
            include: [{
                model: Category,
                attributes: ['id', 'name']
            }]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

// Pobieranie pojedynczego produktu
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category }]
        });
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

// Tworzenie produktu
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, categoryId, sku } = req.body;

        if (!name || !price || !categoryId || !sku) {
            return res.status(400).json({
                message: 'Nazwa, cena, kategoria i SKU są wymagane'
            });
        }

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(400).json({
                message: 'Wybrana kategoria nie istnieje'
            });
        }

        const existingProduct = await Product.findOne({ where: { sku } });
        if (existingProduct) {
            return res.status(400).json({
                message: 'Produkt z tym SKU już istnieje'
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            categoryId,
            sku,
            isActive: true
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

// Aktualizacja produktu
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, categoryId, sku, isActive } = req.body;
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }

        await product.update({
            name: name || product.name,
            description: description !== undefined ? description : product.description,
            price: price || product.price,
            categoryId: categoryId || product.categoryId,
            sku: sku || product.sku,
            isActive: isActive !== undefined ? isActive : product.isActive
        });

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

// Usuwanie produktu
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        await product.destroy();
        res.json({ message: 'Produkt usunięty' });
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Brak pliku' });
        }

        // Przenieś plik do docelowej lokalizacji
        const ext = path.extname(req.file.originalname);
        const newPath = path.join('images/products', `${product.id}${ext}`);
        fs.renameSync(req.file.path, newPath);
        await product.update({ imageUrl: `/${newPath}` });
        res.json({ imageUrl: `/${newPath}` });
    } catch (error) {
        res.status(500).json({ message: 'Błąd uploadu', error: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{ model: Category }]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

// Publiczny endpoint - pojedynczy produkt
exports.getPublicProductById = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { id: req.params.id, isActive: true },
            include: [{ model: Category, attributes: ['id', 'name'] }]
        });
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
