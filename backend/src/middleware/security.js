const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// JWT Blacklist for production
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

// Enhanced CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost',
        'http://localhost:3005',
        process.env.FRONTEND_URL,
        process.env.PRODUCTION_DOMAIN || 'https://cartechstore.com'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'Cookie',
        'X-Requested-With'
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization']
};

// Enhanced security headers with proper CSP
const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['\'self\''],
            styleSrc: [
                '\'self\'',
                '\'unsafe-inline\'',
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com',
                'https://cdn.jsdelivr.net'
            ],
            'style-src-elem': [
                '\'self\'',
                '\'unsafe-inline\'',
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com',
                'https://cdn.jsdelivr.net'
            ],
            scriptSrc: [
                '\'self\'',
                '\'unsafe-inline\'',
                'https://js.stripe.com',
                'https://cdnjs.cloudflare.com',
                'https://cdn.jsdelivr.net'
            ],
            'script-src-attr': [
                '\'self\'',
                '\'unsafe-inline\'',
                '\'unsafe-hashes\''
            ],
            fontSrc: [
                '\'self\'',
                'https://fonts.gstatic.com',
                'https://cdnjs.cloudflare.com'
            ],
            imgSrc: [
                '\'self\'',
                'data:',
                'https:',
                'http:',
                'blob:'
            ],
            connectSrc: [
                '\'self\'',
                'https://api.stripe.com',
                'http://localhost:3005',
                'https://localhost:3005'
            ],
            frameSrc: [
                '\'self\'',
                'https://js.stripe.com'
            ],
            objectSrc: ['\'none\''],
            baseUri: ['\'self\'']
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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
};

// Enhanced rate limiting
const authLimiter = (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') ? 
    (req, res, next) => next() : 
    rateLimit({
        windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
        message: {
            error: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.ceil((parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true
    });

const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Additional headers for cookies
const cookieHeaders = (req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie'
    );
    next();
};

module.exports = {
    jwtBlacklist,
    checkJwtBlacklist,
    corsOptions,
    helmetOptions,
    authLimiter,
    globalLimiter,
    cookieHeaders,
    compression
}; 