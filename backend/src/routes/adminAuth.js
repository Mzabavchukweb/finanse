const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User, AdminSession, SecurityLog } = require('../models');
const { 
    adminAuth, 
    adminLoginLimiter, 
    securityHeaders, 
    verify2FA, 
    logSecurityEvent,
    generateSecureSession 
} = require('../middleware/adminAuth');
const { body, validationResult } = require('express-validator');

// Apply security headers to all admin routes
router.use(securityHeaders);

// Admin login validation
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Nieprawidłowy format email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Hasło musi mieć minimum 8 znaków')
];

// Enhanced admin login endpoint
router.post('/login', adminLoginLimiter, loginValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await logSecurityEvent(req, null, 'validation_error', 'admin_login_failed');
            return res.status(400).json({
                success: false,
                message: 'Błędy walidacji',
                errors: errors.array(),
                code: 'VALIDATION_ERROR'
            });
        }

        const { email, password, rememberMe = false } = req.body;

        // Find admin user
        const user = await User.findOne({ 
            where: { 
                email: email.toLowerCase(),
                role: 'admin'
            }
        });

        if (!user) {
            await logSecurityEvent(req, null, 'user_not_found', 'admin_login_failed');
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy email lub hasło',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check account status
        if (user.status !== 'active') {
            await logSecurityEvent(req, user.id, 'inactive_account', 'admin_login_failed');
            return res.status(403).json({
                success: false,
                message: 'Konto administratora jest nieaktywne',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            // Increment failed login attempts
            if (user.failedLoginAttempts) {
                await user.increment('failedLoginAttempts');
                
                // Lock account after 5 failed attempts
                if (user.failedLoginAttempts >= 5) {
                    user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                    await user.save();
                }
            }

            await logSecurityEvent(req, user.id, 'invalid_password', 'admin_login_failed');
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy email lub hasło',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check if account is locked
        if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
            await logSecurityEvent(req, user.id, 'account_locked', 'admin_login_failed');
            return res.status(423).json({
                success: false,
                message: 'Konto jest tymczasowo zablokowane. Spróbuj ponownie później.',
                code: 'ACCOUNT_LOCKED'
            });
        }

        // Check for 2FA
        if (user.twoFactorSecret) {
            // Generate temporary token for 2FA verification
            const tempToken = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    temp: true,
                    timestamp: Date.now()
                },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );

            await logSecurityEvent(req, user.id, '2fa_required', 'admin_login_pending');
            
            return res.status(200).json({
                success: true,
                requires2FA: true,
                tempToken,
                message: 'Wprowadź kod z aplikacji uwierzytelniającej'
            });
        }

        // Complete login process
        const loginResult = await completeAdminLogin(user, req, rememberMe);
        
        res.status(200).json(loginResult);

    } catch (error) {
        console.error('Admin login error:', error);
        await logSecurityEvent(req, null, 'login_error', 'admin_login_failed');
        
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas logowania',
            code: 'LOGIN_ERROR'
        });
    }
});

// 2FA verification endpoint
router.post('/verify-2fa', async (req, res) => {
    try {
        const { tempToken, token: twoFactorToken } = req.body;

        if (!tempToken || !twoFactorToken) {
            return res.status(400).json({
                success: false,
                message: 'Token tymczasowy i kod 2FA są wymagane',
                code: 'MISSING_TOKENS'
            });
        }

        // Verify temporary token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (jwtError) {
            await logSecurityEvent(req, null, 'invalid_temp_token', 'admin_2fa_failed');
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy token tymczasowy',
                code: 'INVALID_TEMP_TOKEN'
            });
        }

        if (!decoded.temp) {
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy typ tokena',
                code: 'INVALID_TOKEN_TYPE'
            });
        }

        // Get user
        const user = await User.findByPk(decoded.id);
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowa konfiguracja 2FA',
                code: 'INVALID_2FA_CONFIG'
            });
        }

        // Verify 2FA token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: twoFactorToken,
            window: 2 // Allow ±60 seconds
        });

        if (!verified) {
            await logSecurityEvent(req, user.id, 'invalid_2fa_token', 'admin_2fa_failed');
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy kod 2FA',
                code: 'INVALID_2FA_TOKEN'
            });
        }

        // Complete login process
        const loginResult = await completeAdminLogin(user, req, false);
        
        res.status(200).json(loginResult);

    } catch (error) {
        console.error('2FA verification error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Błąd weryfikacji 2FA',
            code: '2FA_ERROR'
        });
    }
});

// Setup 2FA endpoint
router.post('/setup-2fa', adminAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.admin.id);
        
        if (user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: '2FA jest już skonfigurowane',
                code: '2FA_ALREADY_SETUP'
            });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `Cartechstore Admin (${user.email})`,
            issuer: 'Cartechstore'
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Save secret temporarily (will be confirmed after verification)
        user.tempTwoFactorSecret = secret.base32;
        await user.save();

        await logSecurityEvent(req, user.id, '2fa_setup_initiated', 'admin_security_action');

        res.status(200).json({
            success: true,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32,
            message: 'Zeskanuj kod QR w aplikacji uwierzytelniającej'
        });

    } catch (error) {
        console.error('2FA setup error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Błąd konfiguracji 2FA',
            code: '2FA_SETUP_ERROR'
        });
    }
});

// Confirm 2FA setup
router.post('/confirm-2fa', adminAuth, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.admin.id);

        if (!user.tempTwoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Brak oczekującej konfiguracji 2FA',
                code: 'NO_PENDING_2FA'
            });
        }

        // Verify token with temporary secret
        const verified = speakeasy.totp.verify({
            secret: user.tempTwoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy kod weryfikacyjny',
                code: 'INVALID_VERIFICATION_TOKEN'
            });
        }

        // Activate 2FA
        user.twoFactorSecret = user.tempTwoFactorSecret;
        user.tempTwoFactorSecret = null;
        await user.save();

        await logSecurityEvent(req, user.id, '2fa_enabled', 'admin_security_action');

        res.status(200).json({
            success: true,
            message: '2FA został pomyślnie aktywowany'
        });

    } catch (error) {
        console.error('2FA confirmation error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Błąd potwierdzenia 2FA',
            code: '2FA_CONFIRM_ERROR'
        });
    }
});

// Get active sessions
router.get('/sessions', adminAuth, async (req, res) => {
    try {
        const sessions = await AdminSession.getActiveSessions(req.admin.id);
        
        const formattedSessions = sessions.map(session => ({
            id: session.id,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt,
            isCurrent: session.id === req.admin.sessionId
        }));

        res.status(200).json({
            success: true,
            sessions: formattedSessions
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania sesji',
            code: 'SESSIONS_ERROR'
        });
    }
});

// Revoke session
router.delete('/sessions/:sessionId', adminAuth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await AdminSession.findOne({
            where: {
                id: sessionId,
                userId: req.admin.id,
                isActive: true
            }
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Sesja nie została znaleziona',
                code: 'SESSION_NOT_FOUND'
            });
        }

        await session.revoke(req.admin.id);
        await logSecurityEvent(req, req.admin.id, 'session_revoked', 'admin_security_action');

        res.status(200).json({
            success: true,
            message: 'Sesja została unieważniona'
        });

    } catch (error) {
        console.error('Revoke session error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Błąd unieważniania sesji',
            code: 'REVOKE_SESSION_ERROR'
        });
    }
});

// Admin logout endpoint
router.post('/logout', adminAuth, async (req, res) => {
    try {
        if (req.admin.sessionId) {
            const session = await AdminSession.findOne({
                where: {
                    id: req.admin.sessionId,
                    userId: req.admin.id,
                    isActive: true
                }
            });

            if (session) {
                await session.revoke(req.admin.id);
            }
        }

        await logSecurityEvent(req, req.admin.id, 'logout', 'admin_logout_success');

        res.status(200).json({
            success: true,
            message: 'Wylogowano pomyślnie'
        });

    } catch (error) {
        console.error('Admin logout error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Błąd podczas wylogowywania',
            code: 'LOGOUT_ERROR'
        });
    }
});

// Complete admin login helper function
async function completeAdminLogin(user, req, rememberMe = false) {
    try {
        // Reset failed login attempts
        if (user.failedLoginAttempts > 0) {
            user.failedLoginAttempts = 0;
            user.accountLockedUntil = null;
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create secure session
        const sessionHours = rememberMe ? 168 : 8; // 7 days or 8 hours
        const session = await AdminSession.createSession(
            user.id,
            req.ip,
            req.get('User-Agent'),
            sessionHours
        );

        // Generate JWT with session ID
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                sessionId: session.id
            },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '7d' : '8h' }
        );

        await logSecurityEvent(req, user.id, 'login_success', 'admin_login_success');

        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin,
                has2FA: !!user.twoFactorSecret
            },
            session: {
                id: session.id,
                expiresAt: session.expiresAt
            },
            message: 'Zalogowano pomyślnie'
        };

    } catch (error) {
        console.error('Complete login error:', error);
        throw error;
    }
}

module.exports = router; 