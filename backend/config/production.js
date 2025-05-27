module.exports = {
    // Security
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later',
            standardHeaders: true,
            legacyHeaders: false
        },
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
            exposedHeaders: ['X-CSRF-Token'],
            maxAge: 86400 // 24 hours
        },
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ['\'self\''],
                    scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'https://www.google.com', 'https://www.gstatic.com', 'https://js.stripe.com'],
                    styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
                    imgSrc: ['\'self\'', 'data:', 'https:', 'https://*.stripe.com'],
                    connectSrc: ['\'self\'', 'https://api.stripe.com', 'https://*.sentry.io'],
                    fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
                    frameSrc: ['\'self\'', 'https://js.stripe.com', 'https://www.google.com'],
                    objectSrc: ['\'none\''],
                    mediaSrc: ['\'self\''],
                    upgradeInsecureRequests: []
                }
            },
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: true,
            crossOriginResourcePolicy: { policy: 'same-site' },
            dnsPrefetchControl: { allow: false },
            frameguard: { action: 'deny' },
            hidePoweredBy: true,
            hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
            ieNoOpen: true,
            noSniff: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            xssFilter: true
        }
    },

    // Database
    database: {
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000,
            evict: 1000,
            handleDisconnects: true
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            statement_timeout: 60000,
            idle_in_transaction_session_timeout: 60000
        },
        logging: false
    },

    // Logging
    logging: {
        level: 'info',
        format: 'json',
        maxSize: '20m',
        maxFiles: '14d',
        timestamp: true,
        handleExceptions: true,
        handleRejections: true,
        colorize: false
    },

    // Session
    session: {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict',
            path: '/',
            domain: process.env.COOKIE_DOMAIN
        },
        name: '__Host-session',
        rolling: true
    },

    // Cache
    cache: {
        ttl: 3600, // 1 hour
        checkPeriod: 600, // 10 minutes
        max: 1000, // maximum number of items
        dispose: (key, n) => {
            // Custom dispose function
            console.log(`Cache item ${key} disposed`);
        }
    },

    // Compression
    compression: {
        level: 6,
        threshold: 1024, // Only compress responses larger than 1kb
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        }
    },

    // Security Headers
    securityHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
};
