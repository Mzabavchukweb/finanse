require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { User, Product } = require('./src/models');
const db = require('./src/models');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const { router: usersRouter, pendingRouter } = require('./src/routes/users');
const authRouter = require('./src/routes/auth');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const adminRouter = require('./src/routes/admin');
const paymentsRouter = require('./src/routes/payments');
const cartRouter = require('./src/routes/cart');

const app = express();
const PORT = process.env.PORT || 3005;

// JWT config - short token lifetimes
const jwtBlacklist = new Set();

// Middleware to check blacklist
function checkJwtBlacklist(req, res, next) {
    const auth = req.headers.authorization;
    if (auth) {
        const token = auth.split(' ')[1];
        if (jwtBlacklist.has(token)) {
            return res.status(401).json({
                message: 'Token has been invalidated. Please log in again.'
            });
        }
    }
    next();
}
app.use(checkJwtBlacklist);

// Enhanced CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS: Unauthorized domain'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'Cookie',
        'X-Requested-With'
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 hours
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Additional headers for cookies
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie'
    );
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend'), { maxAge: '1d' }));

// Enhanced security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['\'self\''],
            scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
            styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https:'],
            imgSrc: ['\'self\'', 'data:', 'https:', 'blob:'],
            connectSrc: ['\'self\'', 'https:', 'wss:'],
            fontSrc: ['\'self\'', 'https:', 'data:'],
            objectSrc: ['\'none\''],
            mediaSrc: ['\'self\'', 'https:'],
            frameSrc: ['\'none\''],
            workerSrc: ['\'self\'', 'blob:'],
            childSrc: ['\'self\'', 'blob:']
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
}));

// Compression of responses
app.use(compression());

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Enhanced rate limiting
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10,
    message: 'Too many attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', globalLimiter);

// API Router
const apiRouter = express.Router();

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
apiRouter.get('/users', adminAuth, async (req, res) => {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
});

// Delete user
apiRouter.delete('/users/:id', adminAuth, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
});

// Products endpoint
apiRouter.get('/products', adminAuth, async (req, res) => {
    const products = await Product.findAll();
    res.json(products);
});

// Mount API router
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', usersRouter);
app.use('/api/pending-users', pendingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/cart', cartRouter);

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/b2b-registration.html'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../frontend/pages/404.html'));
});

// Performance monitoring middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Error handling middleware
app.use((err, req, res) => {
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

// Middleware to check server status
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Middleware to handle not found endpoints
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
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
if (process.env.NODE_ENV !== 'test') {
    db.sequelize.sync()
        .then(() => {
            console.log('Database synced successfully');
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
                console.log(`API available at http://localhost:${PORT}/api`);
            }).on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(`Port ${PORT} is already in use. Please try a different port.`);
                    throw err;
                } else {
                    console.error('Server error:', err);
                }
            });
        })
        .catch(err => {
            console.error('Error syncing database:', err);
        });
}
