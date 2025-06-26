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

// POST /create-intent - Enhanced with multiple payment methods
router.post('/create-intent', userAuth, async (req, res) => {
    const { amount, currency = 'pln', paymentMethods } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Nieprawidłowa kwota.' });
    }

    try {
        console.log('Creating payment intent:', { amount, currency, userId: req.user.id });
        
        // Supported payment methods for Poland/Europe
        const enabledPaymentMethods = ['card'];
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to smallest currency unit (grosz for PLN)
            currency: currency.toLowerCase(),
            payment_method_types: enabledPaymentMethods,
            metadata: { 
                userId: req.user.id, 
                email: req.user.email || '',
                source: 'cartechstore-checkout'
            },
            description: 'Zamówienie - Cartechstore B2B',
            statement_descriptor_suffix: 'CARTECHSTORE'
        });

        console.log('Payment intent created:', paymentIntent.id);

        res.json({ 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paymentMethods: enabledPaymentMethods
        });
        
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        res.status(500).json({ 
            message: 'Błąd tworzenia płatności', 
            error: error.message 
        });
    }
});

// POST /confirm-payment - Confirm payment on server side
router.post('/confirm-payment', userAuth, async (req, res) => {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
        return res.status(400).json({ message: 'Brak ID płatności.' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            console.log('Payment confirmed:', paymentIntentId);
            
            res.json({
                success: true,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency
            });
        } else {
            res.json({
                success: false,
                status: paymentIntent.status,
                message: 'Płatność nie została zakończona'
            });
        }
        
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ 
            message: 'Błąd potwierdzania płatności', 
            error: error.message 
        });
    }
});

// GET /payment-methods - Get available payment methods for country
router.get('/payment-methods', (req, res) => {
    const { country = 'PL' } = req.query;
    
    const paymentMethodsByCountry = {
        'PL': ['card', 'blik', 'p24', 'sepa_debit'],
        'DE': ['card', 'giropay', 'sepa_debit', 'sofort'],
        'NL': ['card', 'ideal', 'sepa_debit'],
        'BE': ['card', 'bancontact', 'sepa_debit'],
        'AT': ['card', 'eps', 'sepa_debit'],
        'default': ['card', 'sepa_debit']
    };
    
    const methods = paymentMethodsByCountry[country] || paymentMethodsByCountry['default'];
    
    res.json({
        country,
        paymentMethods: methods,
        currency: country === 'PL' ? 'pln' : 'eur'
    });
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object.id);
            // Handle successful payment
            break;
        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object.id);
            // Handle failed payment
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = router;
