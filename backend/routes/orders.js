const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { Order, User } = require('../models');

// All order routes require authentication
router.use(protect);

// Get user's orders
router.get('/', orderController.getUserOrders);

// Get single order
router.get('/:id', orderController.getOrder);

// Walidacja tworzenia zamówienia
const createOrderValidation = [
    body('shippingAddress')
        .isObject().withMessage('Adres dostawy jest wymagany')
        .custom(addr => !!addr.street && !!addr.city && !!addr.postalCode)
        .withMessage('Adres dostawy musi zawierać ulicę, miasto i kod pocztowy'),
    body('paymentMethod')
        .isString().withMessage('Metoda płatności jest wymagana')
        .isLength({ min: 2, max: 50 }).withMessage('Nieprawidłowa metoda płatności')
];

// Walidacja zmiany statusu zamówienia
const updateStatusValidation = [
    body('status')
        .isString().withMessage('Status jest wymagany')
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Nieprawidłowy status zamówienia')
];

// Create new order
router.post('/', createOrderValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, orderController.createOrder);

// Cancel order
router.patch('/:id/cancel', orderController.cancelOrder);

// Admin routes
router.use(authorize('admin'));

// Get all orders (admin only)
router.get('/admin/all', orderController.getAllOrders);

// Update order status (admin only)
router.patch('/:id/status', updateStatusValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, orderController.updateOrderStatus);

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

// POST / - tworzenie zamówienia i PaymentIntent
router.post('/', userAuth, async (req, res) => {
    const { amount, currency } = req.body;
    if (!amount) return res.status(400).json({ message: 'Brak kwoty.' });
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency || 'pln',
            metadata: { userId: req.user.id, email: req.user.email }
        });
        const order = await Order.create({
            userId: req.user.id,
            amount: Math.round(amount * 100),
            currency: currency || 'pln',
            status: 'new',
            paymentStatus: 'pending',
            paymentIntentId: paymentIntent.id
        });
        res.json({ orderId: order.id, clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Stripe/order error:', err);
        res.status(500).json({ message: 'Błąd tworzenia zamówienia', error: err.message });
    }
});

// GET / - lista zamówień użytkownika
router.get('/', userAuth, async (req, res) => {
    const orders = await Order.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(orders);
});

// GET /:id - szczegóły zamówienia
router.get('/:id', userAuth, async (req, res) => {
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Nie znaleziono zamówienia.' });
    res.json(order);
});

module.exports = router;
