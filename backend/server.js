require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./src/models');

// Import modularized components
const {
    corsOptions,
    helmetOptions,
    authLimiter,
    globalLimiter,
    cookieHeaders,
    checkJwtBlacklist,
    compression
} = require('./src/middleware/security');

const { router: apiRouter } = require('./src/routes/api');
const {
    setupStaticFiles,
    setupHtmlRoutes,
    setupUtilityRoutes
} = require('./src/middleware/staticFiles');

// Import existing routes
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const { router: usersRouter, pendingRouter } = require('./src/routes/users');
const authRouter = require('./src/routes/auth');
const adminRouter = require('./src/routes/admin');
const paymentsRouter = require('./src/routes/payments');
const cartRouter = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const adminAuthRoutes = require('./src/routes/adminAuth');
const analyticsRouter = require('./src/routes/analytics');

const app = express();
const PORT = process.env.PORT || 3005;

// Enable JWT blacklist in production
if (process.env.NODE_ENV === 'production') {
    app.use(checkJwtBlacklist);
}

// Apply security middleware
app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(compression());
app.use(cookieHeaders);

// Body parsers with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup static file serving and HTML routes
setupStaticFiles(app);
setupHtmlRoutes(app);
setupUtilityRoutes(app);

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin-auth/login', authLimiter);
app.use('/api', globalLimiter);

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api', apiRouter);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', usersRouter);
app.use('/api/pending-users', pendingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRouter);

// 404 handler for missing routes
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found',
            path: req.originalUrl
        });
    } else {
        res.status(404).send('Page not found');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors
        });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Missing authorization'
        });
    }
    res.status(500).json({
        success: false,
        message: 'Server error'
    });
});

// Handle unhandled exceptions
process.on('uncaughtException', (err) => {
    console.error('Unhandled exception:', err);
    throw err;
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejected promise:', reason);
});

// Database sync and server start
// db.sequelize.sync() // NIE UŻYWAĆ sync przy migracjach
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}/api`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
        throw err;
    } else {
        console.error('Server error:', err);
    }
});

// Export app for testing
module.exports = app;
