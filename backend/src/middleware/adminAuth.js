const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User, SecurityLog, AdminSession } = require('../models');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

// Enhanced rate limiting for admin endpoints
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for localhost in development
        return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
    }
});

const adminActionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each admin to 60 actions per minute
    message: {
        success: false,
        message: 'Zbyt wiele akcji. Spróbuj ponownie za chwilę.',
        code: 'ACTION_RATE_LIMIT'
    },
    keyGenerator: (req) => {
        return req.admin?.id || req.ip;
    }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "script-src-attr 'self' 'unsafe-inline' 'unsafe-hashes'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https: http: blob:; " +
        "connect-src 'self' https://api.stripe.com http://localhost:3005; " +
        "frame-src 'self' https://js.stripe.com; " +
        "object-src 'none'; " +
        "base-uri 'self'"
    );
    next();
};

// Enhanced admin authentication middleware
const adminAuth = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            await logSecurityEvent(req, null, 'missing_token', 'admin_access_denied');
            return res.status(401).json({
                success: false,
                message: 'Brak tokena autoryzacji',
                code: 'MISSING_TOKEN'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            await logSecurityEvent(req, null, 'invalid_token', 'admin_access_denied');
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy token autoryzacji',
                code: 'INVALID_TOKEN'
            });
        }

        // Check if user exists and is admin
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'email', 'role', 'status', 'lastLogin', 'twoFactorSecret']
        });

        if (!user) {
            await logSecurityEvent(req, decoded.id, 'user_not_found', 'admin_access_denied');
            return res.status(401).json({
                success: false,
                message: 'Użytkownik nie istnieje',
                code: 'USER_NOT_FOUND'
            });
        }

        if (user.role !== 'admin') {
            await logSecurityEvent(req, user.id, 'insufficient_privileges', 'admin_access_denied');
            return res.status(403).json({
                success: false,
                message: 'Brak uprawnień administratora',
                code: 'INSUFFICIENT_PRIVILEGES'
            });
        }

        if (user.status !== 'active') {
            await logSecurityEvent(req, user.id, 'inactive_account', 'admin_access_denied');
            return res.status(403).json({
                success: false,
                message: 'Konto administratora jest nieaktywne',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Check session validity if session ID provided
        if (decoded.sessionId) {
            const session = await AdminSession.findOne({
                where: {
                    id: decoded.sessionId,
                    userId: user.id,
                    isActive: true
                }
            });

            if (!session) {
                await logSecurityEvent(req, user.id, 'invalid_session', 'admin_access_denied');
                return res.status(401).json({
                    success: false,
                    message: 'Sesja wygasła lub jest nieprawidłowa',
                    code: 'INVALID_SESSION'
                });
            }

            // Update session last activity
            session.lastActivity = new Date();
            await session.save();
        }

        // Check for suspicious activity patterns
        await checkSuspiciousActivity(req, user);

        // Attach user to request
        req.admin = {
            id: user.id,
            email: user.email,
            role: user.role,
            sessionId: decoded.sessionId
        };

        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        await logSecurityEvent(req, null, 'auth_error', 'admin_access_denied');
        return res.status(500).json({
            success: false,
            message: 'Błąd autoryzacji',
            code: 'AUTH_ERROR'
        });
    }
};

// Enhanced 2FA verification middleware
const verify2FA = async (req, res, next) => {
    try {
        const { token: twoFactorToken } = req.body;
        const tempToken = req.headers['x-temp-token'];

        if (!tempToken || !twoFactorToken) {
            return res.status(400).json({
                success: false,
                message: 'Kod 2FA jest wymagany',
                code: 'MISSING_2FA_TOKEN'
            });
        }

        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowa konfiguracja 2FA',
                code: 'INVALID_2FA_CONFIG'
            });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: twoFactorToken,
            window: 2 // Allow 2 time steps (±60 seconds)
        });

        if (!verified) {
            await logSecurityEvent(req, user.id, 'invalid_2fa', 'admin_login_failed');
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy kod 2FA',
                code: 'INVALID_2FA_TOKEN'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('2FA verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd weryfikacji 2FA',
            code: '2FA_ERROR'
        });
    }
};

// Log security events
const logSecurityEvent = async (req, userId, eventType, outcome) => {
    try {
        const clientInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        await SecurityLog.create({
            userId,
            eventType,
            outcome,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: JSON.stringify({
                path: req.path,
                method: req.method,
                headers: {
                    'user-agent': req.get('User-Agent'),
                    'referer': req.get('Referer'),
                    'accept-language': req.get('Accept-Language')
                }
            })
        });
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
};

// Check for suspicious activity patterns
const checkSuspiciousActivity = async (req, user) => {
    const suspiciousPatterns = [
        // Multiple rapid requests from same IP
        {
            timeWindow: 5 * 60 * 1000, // 5 minutes
            maxEvents: 100,
            eventTypes: ['admin_action']
        },
        // Failed login attempts
        {
            timeWindow: 60 * 60 * 1000, // 1 hour
            maxEvents: 10,
            eventTypes: ['admin_login_failed']
        }
    ];

    for (const pattern of suspiciousPatterns) {
        const recentEvents = await SecurityLog.count({
            where: {
                ipAddress: req.ip,
                eventType: pattern.eventTypes,
                createdAt: {
                    [require('sequelize').Op.gte]: new Date(Date.now() - pattern.timeWindow)
                }
            }
        });

        if (recentEvents >= pattern.maxEvents) {
            await logSecurityEvent(req, user.id, 'suspicious_activity', 'security_alert');
            console.warn(`Suspicious activity detected for IP ${req.ip}: ${recentEvents} events in ${pattern.timeWindow}ms`);
        }
    }
};

// Generate secure session
const generateSecureSession = async (userId, req) => {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    const session = await AdminSession.create({
        id: sessionId,
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        expiresAt,
        isActive: true,
        lastActivity: new Date()
    });

    return session;
};

// Cleanup expired sessions
const cleanupExpiredSessions = async () => {
    try {
        const expiredCount = await AdminSession.destroy({
            where: {
                expiresAt: {
                    [require('sequelize').Op.lt]: new Date()
                }
            }
        });
        
        if (expiredCount > 0) {
            console.log(`Cleaned up ${expiredCount} expired admin sessions`);
        }
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
    }
};

// Run cleanup every hour - only in production/development, not in tests
let cleanupInterval;
if (process.env.NODE_ENV !== 'test') {
    cleanupInterval = setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}

// Function to stop cleanup interval (for testing purposes)
const stopCleanupInterval = () => {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
};

module.exports = {
    adminAuth,
    adminLoginLimiter,
    adminActionLimiter,
    securityHeaders,
    verify2FA,
    logSecurityEvent,
    generateSecureSession,
    cleanupExpiredSessions,
    stopCleanupInterval
}; 