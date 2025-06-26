const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Product, Category } = require('../models');

const router = express.Router();

// Admin authorization middleware
function adminAuth(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ message: 'Missing token' });
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Missing permissions' });
        }
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Users list (for admin)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await user.destroy();
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// Products endpoint
router.get('/products', adminAuth, async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Featured products endpoint (public) - for homepage
router.get('/featured-products', async (req, res) => {
    try {
        const featuredProducts = await Product.findAll({
            where: {
                isFeatured: true,
                isActive: true
            },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }],
            limit: 6,
            order: [['createdAt', 'DESC']]
        });

        const productsWithImages = featuredProducts.map(product => {
            let images = [];
            try {
                images = product.images ? JSON.parse(product.images) : [];
            } catch (e) {
                images = product.imageUrl ? [product.imageUrl] : [];
            }

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                sku: product.sku,
                brand: product.brand,
                category: product.category,
                imageUrl: product.imageUrl || (images.length > 0 ? images[0] : '/images/placeholder-product.jpg'),
                images: images,
                stock: product.stock,
                isActive: product.isActive,
                isFeatured: product.isFeatured
            };
        });

        res.json({
            success: true,
            products: productsWithImages,
            count: productsWithImages.length
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania polecanych produktów'
        });
    }
});

// Brands endpoint
router.get('/brands', (req, res) => {
    res.json({
        brands: [
            { id: 1, name: 'Audi', models: ['A3', 'A4', 'A6', 'Q3', 'Q5'] },
            { id: 2, name: 'BMW', models: ['Serie 1', 'Serie 3', 'Serie 5', 'X1', 'X3'] },
            { id: 3, name: 'Mercedes', models: ['A-Klasa', 'C-Klasa', 'E-Klasa', 'GLA', 'GLC'] },
            { id: 4, name: 'Volkswagen', models: ['Golf', 'Passat', 'Polo', 'Tiguan', 'Touran'] }
        ]
    });
});

// Main categories endpoint
router.get('/main-categories', (req, res) => {
    res.json({
        categories: [
            { id: 'hamulce', name: 'Hamulce', count: 156 },
            { id: 'filtry', name: 'Filtry', count: 243 },
            { id: 'oleje', name: 'Oleje', count: 89 },
            { id: 'zawieszenie', name: 'Zawieszenie', count: 134 },
            { id: 'silnik', name: 'Silnik', count: 298 },
            { id: 'wydech', name: 'Układ wydechowy', count: 67 },
            { id: 'elektryka', name: 'Elektryka', count: 178 },
            { id: 'klimatyzacja', name: 'Klimatyzacja', count: 92 }
        ]
    });
});

// Stripe public keys endpoint - SECURE VERSION
router.get('/stripe/config', (req, res) => {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
        return res.status(500).json({
            error: 'Stripe configuration not available'
        });
    }
    
    res.json({
        publishableKey: publishableKey
    });
});

// Test email endpoint for admin
router.post('/auth/test-email', adminAuth, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        console.log('Test email request for:', email);

        try {
            // Try to send real email
            const emailResult = await require('../utils/email').sendEmail(email, {
                subject: 'Test Email - Cartechstore Admin Panel',
                html: `
                    <h2>Test Email</h2>
                    <p>To jest testowy email z panelu administracyjnego Cartechstore.</p>
                    <p>Wysłany: ${new Date().toLocaleString('pl-PL')}</p>
                    <p>Jeśli otrzymujesz ten email, znaczy że system emailowy działa poprawnie.</p>
                `
            });

            res.json({
                success: true,
                message: `Email testowy został wysłany do ${email}`,
                emailId: emailResult.id,
                provider: emailResult.provider,
                simulated: emailResult.simulated || false,
                timestamp: new Date().toISOString()
            });

        } catch (emailError) {
            console.error('Email sending failed:', emailError);

            // Return simulated success for development
            res.json({
                success: true,
                message: `Email testowy został ZASYMULOWANY dla ${email} (tryb developerski)`,
                simulated: true,
                error: emailError.message,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd podczas wysyłania testowego emaila',
            error: error.message
        });
    }
});

module.exports = { router, adminAuth }; 