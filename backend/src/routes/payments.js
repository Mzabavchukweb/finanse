const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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

// POST /create-intent
router.post('/create-intent', userAuth, async (req, res) => {
    const { amount, currency } = req.body;
    if (!amount) return res.status(400).json({ message: 'Brak kwoty.' });
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // zł -> grosze
            currency: currency || 'pln',
            metadata: { userId: req.user.id, email: req.user.email }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Stripe error:', err);
        res.status(500).json({ message: 'Błąd Stripe', error: err.message });
    }
});

module.exports = router;
