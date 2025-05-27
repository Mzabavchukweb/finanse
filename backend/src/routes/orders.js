const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const { body, validationResult } = require('express-validator');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { Order, User } = require('../models');

// Wszystkie trasy wymagają autoryzacji JWT
router.use(protect);

// Trasy użytkownika
router.get('/', orderController.getUserOrders);
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

const updateStatusValidation = [
    body('status')
        .isString().withMessage('Status jest wymagany')
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Nieprawidłowy status zamówienia')
];

// Tworzenie zamówienia
router.post('/', createOrderValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, orderController.createOrder);

// Anulowanie zamówienia
router.patch('/:id/cancel', orderController.cancelOrder);

// Trasy admina
router.use(restrictTo('admin'));
router.get('/admin/all', orderController.getAllOrders);
router.patch('/:id/status', updateStatusValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, orderController.updateOrderStatus);

module.exports = router;
