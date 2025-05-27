const express = require('express');
const router = express.Router();
const path = require('path');
const { protect, restrictTo } = require(path.resolve(__dirname, '../middleware/auth'));
const cartController = require('../controllers/cartController');
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');

// All cart routes require authentication
router.use(protect);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/items', cartController.addItem);

// Submit inquiry
router.post('/submit', cartController.submitInquiry);

// Admin routes
router.use(restrictTo('admin'));

// Respond to inquiry
router.post('/:cartId/respond', cartController.respondToInquiry);

// User routes (back to normal user)
router.use(protect);

// Handle inquiry response (accept/reject)
router.post('/:cartId/response', cartController.handleInquiryResponse);

// Update cart item quantity
router.patch('/items/:productId', cartController.updateItemQuantity);

// Remove item from cart
router.delete('/items/:productId', cartController.removeItem);

// Clear cart
router.delete('/', cartController.clearCart);

// Middleware: sprawdź JWT
function userAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Brak tokena.' });
    try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Nieprawidłowy token.' });
    }
}

// POST /cart/add
router.post('/add', userAuth, async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const cartItem = await Cart.create({
            userId: req.user.id,
            productId,
            quantity
        });
        res.status(201).json(cartItem);
    } catch (e) {
        res.status(500).json({ message: 'Błąd dodawania do koszyka.' });
    }
});

// DELETE /cart/remove/:id
router.delete('/remove/:id', userAuth, async (req, res) => {
    try {
        await Cart.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ message: 'Błąd usuwania z koszyka.' });
    }
});

// PUT /cart/update/:id
router.put('/update/:id', userAuth, async (req, res) => {
    const { quantity } = req.body;
    try {
        const cartItem = await Cart.update(
            { quantity },
            {
                where: {
                    id: req.params.id,
                    userId: req.user.id
                }
            }
        );
        res.status(200).json(cartItem);
    } catch (e) {
        res.status(500).json({ message: 'Błąd aktualizacji koszyka.' });
    }
});

module.exports = router;
