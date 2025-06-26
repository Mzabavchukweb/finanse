const express = require('express');
const path = require('path');
const fs = require('fs');

// Helper function to serve HTML files with error handling
function serveHtmlFile(filePath, errorMessage = 'Page not found') {
    return (req, res) => {
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error(`Error serving ${path.basename(filePath)}:`, err);
                res.status(500).send(`Error loading ${errorMessage}`);
            }
        });
    };
}

// Admin auth middleware (simple version for static files)
function simpleAdminAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send('Unauthorized');
    
    try {
        const token = auth.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).send('Forbidden');
        }
        next();
    } catch (e) {
        return res.status(401).send('Unauthorized');
    }
}

// Setup static file serving
function setupStaticFiles(app) {
    const frontendPath = path.join(__dirname, '../../../frontend');

    // Serve static files with security headers
    app.use(express.static(frontendPath, {
        maxAge: '1d',
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            // Security headers for static files
            res.setHeader('X-Content-Type-Options', 'nosniff');
            if (filePath.endsWith('.html')) {
                res.setHeader('X-Frame-Options', 'DENY');
                res.setHeader('X-XSS-Protection', '1; mode=block');
            }
        }
    }));

    // Static directories
    app.use('/css', express.static(path.join(frontendPath, 'css')));
    app.use('/js', express.static(path.join(frontendPath, 'js')));
    app.use('/images', express.static(path.join(frontendPath, 'images')));
    app.use('/assets', express.static(path.join(frontendPath, 'assets')));
    
    // Serve uploaded files
    app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
}

// Setup HTML routes
function setupHtmlRoutes(app) {
    const pagesPath = path.join(__dirname, '../../../frontend/pages');

    // Main pages
    app.get('/', serveHtmlFile(path.join(pagesPath, 'index.html'), 'homepage'));
    app.get('/index.html', serveHtmlFile(path.join(pagesPath, 'index.html'), 'homepage'));
    app.get('/pages/index.html', serveHtmlFile(path.join(pagesPath, 'index.html'), 'homepage'));

    // Authentication pages
    app.get('/login', serveHtmlFile(path.join(pagesPath, 'login.html'), 'login page'));
    app.get('/pages/login.html', serveHtmlFile(path.join(pagesPath, 'login.html'), 'login page'));
    
    app.get('/register', serveHtmlFile(path.join(pagesPath, 'b2b-registration.html'), 'registration page'));
    app.get('/pages/b2b-registration.html', serveHtmlFile(path.join(pagesPath, 'b2b-registration.html'), 'registration page'));

    // Email verification
    app.get('/verify-email', serveHtmlFile(path.join(pagesPath, 'verify-email.html'), 'email verification page'));
    app.get('/pages/verify-email.html', serveHtmlFile(path.join(pagesPath, 'verify-email.html'), 'email verification page'));

    // Admin pages (protected)
    app.get('/admin-login', serveHtmlFile(path.join(pagesPath, 'admin-login.html'), 'admin login page'));
    app.get('/pages/admin-login.html', serveHtmlFile(path.join(pagesPath, 'admin-login.html'), 'admin login page'));
    
    app.get('/admin', simpleAdminAuth, serveHtmlFile(path.join(pagesPath, 'admin.html'), 'admin page'));
    app.get('/pages/admin.html', simpleAdminAuth, serveHtmlFile(path.join(pagesPath, 'admin.html'), 'admin page'));

    // E-commerce pages
    app.get('/cart', serveHtmlFile(path.join(pagesPath, 'cart.html'), 'cart page'));
    app.get('/pages/cart.html', serveHtmlFile(path.join(pagesPath, 'cart.html'), 'cart page'));
    
    app.get('/checkout', serveHtmlFile(path.join(pagesPath, 'checkout.html'), 'checkout page'));
    app.get('/pages/checkout.html', serveHtmlFile(path.join(pagesPath, 'checkout.html'), 'checkout page'));

    // Generic page handler for /pages directory
    app.get('/pages/:page', (req, res) => {
        const pagePath = path.join(pagesPath, req.params.page);
        if (fs.existsSync(pagePath)) {
            res.sendFile(pagePath);
        } else {
            res.status(404).send('Page not found');
        }
    });

    // Generic HTML file handler
    app.get('/:page.html', (req, res) => {
        const filePath = path.join(pagesPath, req.params.page + '.html');
        res.sendFile(filePath, (err) => {
            if (err) {
                res.status(404).send('Page not found');
            }
        });
    });
}

// Setup utility routes
function setupUtilityRoutes(app) {
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // Favicon endpoints
    app.get('/favicon-32x32.png', (req, res) => {
        res.status(204).end();
    });

    app.get('/favicon-16x16.png', (req, res) => {
        res.status(204).end();
    });

    app.get('/apple-touch-icon.png', (req, res) => {
        res.status(204).end();
    });

    // Chrome dev tools endpoint
    app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
        res.status(404).json({ error: 'Not found' });
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
}

module.exports = {
    setupStaticFiles,
    setupHtmlRoutes,
    setupUtilityRoutes,
    serveHtmlFile,
    simpleAdminAuth
}; 