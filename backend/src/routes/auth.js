const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');
const { validateRegistration, validateLogin } = require('../middleware/validators');
const { register, login, getProfile, verifyEmail, checkCompany } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateMiddleware');
const { body } = require('express-validator');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const securityLogger = require('../middleware/securityLogger');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { 
        success: false,
        message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registrations per hour
    message: { 
        success: false,
        message: 'Zbyt wiele rejestracji z tego IP. Spróbuj ponownie za godzinę.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: { 
        success: false,
        message: 'Zbyt wiele próśb resetowania hasła. Spróbuj ponownie za godzinę.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Walidacja danych rejestracji
const registerValidation = [
    body('firstName').trim().notEmpty().withMessage('Imię jest wymagane'),
    body('lastName').trim().notEmpty().withMessage('Nazwisko jest wymagane'),
    body('email').isEmail().withMessage('Nieprawidłowy format email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Hasło musi mieć minimum 8 znaków')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Hasło musi zawierać wielkie litery, małe litery, cyfry i znaki specjalne'),
    // Pola firmowe są opcjonalne
    body('companyName').optional().trim(),
    body('companyCountry').optional().isIn(['PL', 'DE', 'CZ']),
    body('nip').optional().trim(),
    body('phone').optional().trim(),
    body('address.street').optional().trim(),
    body('address.postalCode').optional().trim(),
    body('address.city').optional().trim()
];

// Walidacja danych logowania
const loginValidation = [
    body('email').isEmail().withMessage('Nieprawidłowy format email'),
    body('password').notEmpty().withMessage('Hasło jest wymagane')
];

// Rate limit tylko dla logowania admina
const adminLoginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuta
    max: 5,
    message: { message: 'Zbyt wiele prób logowania. Spróbuj za minutę.' }
});

console.log('Router /api/auth działa!');

// Register new user
router.post('/register', 
    process.env.NODE_ENV === 'test' ? (req, res, next) => next() : (req, res, next) => {
        registerLimiter(req, res, (err) => {
            if (err) {
                console.warn('Rate limit triggered on /register:', req.ip);
            }
            next(err);
        });
    },
    registerValidation, 
    async (req, res) => {
    console.log('Odebrano POST /api/auth/register');
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Błędy walidacji',
                errors: errors.array() 
            });
        }

        const {
            email,
            password,
            firstName,
            lastName,
            companyName,
            companyCountry,
            nip,
            phone,
            address
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Użytkownik o tym adresie email już istnieje' 
            });
        }

        // Check if NIP already exists (if provided)
        if (nip) {
            const existingNIP = await User.findOne({ where: { nip } });
            if (existingNIP) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Użytkownik o tym numerze NIP już istnieje' 
                });
            }
        }

        // Create new user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            companyName,
            companyCountry: companyCountry || 'PL',
            nip,
            phone,
            street: address?.street,
            postalCode: address?.postalCode,
            city: address?.city,
            role: req.body.role === 'admin' ? 'admin' : 'user',
            isEmailVerified: req.body.role === 'admin' ? true : false,
            status: req.body.role === 'admin' ? 'active' : 'pending_email_verification'
        });

        // Generate email verification token
        const emailVerificationToken = require('crypto').randomBytes(32).toString('hex');
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
        await user.save();
        
        // Send verification email
        try {
            const activationLink = `${process.env.FRONTEND_URL}/pages/verify-email.html?token=${emailVerificationToken}`;
            const emailTemplate = {
                subject: 'Aktywuj swoje konto w Cartechstore!',
                html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #2563eb 60%, #1e40af 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                    <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Witaj, ${user.firstName}!</h1>
                    <p style="color: #e0e7ef; font-size: 1.1rem; margin: 0;">Dziękujemy za rejestrację w Cartechstore.</p>
                  </div>
                  <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                    <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">
                      Aby aktywować swoje konto, kliknij w poniższy przycisk:
                    </p>
                    <a href="${activationLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 0.8rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; margin-bottom: 2rem;">
                      Aktywuj konto
                    </a>
                    <p style="font-size: 1.05rem; color: #64748b; margin-top: 2rem;">
                      Link aktywacyjny jest ważny przez 24 godziny.<br>
                      Po weryfikacji emaila, Twoje konto zostanie przesłane do akceptacji przez administratora.
                    </p>
                  </div>
                </div>
                `
            };
            
            const emailResult = await require('../utils/email').sendEmail(user.email, emailTemplate);
            console.log('Email verification sent successfully to:', user.email);
            
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            // Continue with registration even if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Rejestracja przebiegła pomyślnie! Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Wystąpił błąd podczas rejestracji' 
        });
    }
});

// Weryfikuj reCAPTCHA
async function verifyRecaptcha(token) {
    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: token
            }
        });
        return response.data.success;
    } catch (err) {
        console.error('Błąd weryfikacji reCAPTCHA:', err);
        return false;
    }
}

// Logowanie
router.post('/login', 
    process.env.NODE_ENV !== 'test' ? loginLimiter : (req, res, next) => next(),
    async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email i hasło są wymagane' 
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            await securityLogger.logLoginFailure(req, email, 'user_not_found');
            return res.status(401).json({ 
                success: false,
                message: 'Nieprawidłowy email lub hasło' 
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                success: false,
                message: 'Konto nie zostało aktywowane. Sprawdź email i kliknij w link aktywacyjny.' 
            });
        }

        // Check if account is approved by admin
        if (user.status !== 'active') {
            return res.status(403).json({ 
                success: false,
                message: 'Konto oczekuje na akceptację przez administratora lub zostało zablokowane.' 
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            await securityLogger.logLoginFailure(req, email, 'invalid_password');
            return res.status(401).json({ 
                success: false,
                message: 'Nieprawidłowy email lub hasło' 
            });
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            await securityLogger.logLoginFailure(req, email, 'account_locked');
            return res.status(403).json({ 
                success: false,
                message: 'Konto jest tymczasowo zablokowane. Spróbuj ponownie później.' 
            });
        }

        // Reset failed login attempts on successful login
        if (user.failedLoginAttempts > 0) {
            await user.resetFailedLoginAttempts();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // If user has 2FA enabled
        if (user.twoFactorSecret) {
            const tempToken = jwt.sign(
                { id: user.id, email: user.email, temp: true },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            await securityLogger.logLoginSuccess(req, user);
            return res.json({
                success: true,
                requires2FA: true,
                tempToken
            });
        }

        // Standard login
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await securityLogger.logLoginSuccess(req, user);
        res.json({ 
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                companyName: user.companyName,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Błąd logowania:', err);
        res.status(500).json({ 
            success: false,
            message: 'Błąd serwera' 
        });
    }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token weryfikacyjny jest wymagany'
            });
        }

        const user = await User.findOne({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: { [require('sequelize').Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowy lub wygasły token weryfikacyjny'
            });
        }

        // Update user verification status
        user.isEmailVerified = true;
        user.status = 'pending_admin_approval';
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Email został pomyślnie zweryfikowany. Konto oczekuje teraz na akceptację przez administratora.'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas weryfikacji emaila'
        });
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email jest wymagany'
            });
        }

        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Użytkownik o podanym adresie email nie istnieje'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email jest już zweryfikowany'
            });
        }

        // Generate new verification token
        const emailVerificationToken = require('crypto').randomBytes(32).toString('hex');
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
        await user.save();

        // Send verification email
        try {
            const activationLink = `${process.env.FRONTEND_URL}/pages/verify-email.html?token=${emailVerificationToken}`;
            const emailTemplate = {
                subject: 'Ponowna aktywacja konta - Cartechstore',
                html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #2563eb 60%, #1e40af 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                    <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Witaj ponownie, ${user.firstName}!</h1>
                    <p style="color: #e0e7ef; font-size: 1.1rem; margin: 0;">Oto nowy link aktywacyjny dla Twojego konta.</p>
                  </div>
                  <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                    <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">
                      Kliknij w poniższy przycisk, aby aktywować swoje konto:
                    </p>
                    <a href="${activationLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 0.8rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; margin-bottom: 2rem;">
                      Aktywuj konto
                    </a>
                    <p style="font-size: 1.05rem; color: #64748b; margin-top: 2rem;">
                      Link aktywacyjny jest ważny przez 24 godziny.
                    </p>
                  </div>
                </div>
                `
            };
            
            const emailResult = await require('../utils/email').sendEmail(user.email, emailTemplate);
            
            res.status(200).json({
                success: true,
                message: 'Nowy link weryfikacyjny został wysłany na Twój adres email'
            });
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            res.status(500).json({
                success: false,
                message: 'Wystąpił błąd podczas wysyłania emaila weryfikacyjnego'
            });
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas wysyłania ponownego emaila weryfikacyjnego'
        });
    }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'firstName', 'lastName', 'companyName', 'role']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Sprawdzanie czy firma istnieje
router.post('/check-company', checkCompany);

// Cart token endpoint (for frontend compatibility)
router.post('/cart-token', (req, res) => {
    res.json({ 
        success: true, 
        token: require('crypto').randomUUID() 
    });
});

// RESET PASSWORD - GENERATE TOKEN & SEND EMAIL
router.post('/forgot-password', 
    process.env.NODE_ENV !== 'test' ? passwordResetLimiter : (req, res, next) => next(),
    async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email jest wymagany.' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).json({ message: 'Jeśli email istnieje, wysłaliśmy link do resetu hasła.' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    // Wyślij maila przez Resend
    await sendEmail(user.email, {
        subject: 'Resetowanie hasła - Cartechstore',
        html: `<p>Kliknij w link, aby zresetować hasło: <a href='${resetUrl}'>Resetuj hasło</a></p>`
    });
    res.json({ message: 'Jeśli email istnieje, wysłaliśmy link do resetu hasła.' });
});

// RESET PASSWORD - SET NEW PASSWORD
router.post('/reset-password', 
    process.env.NODE_ENV !== 'test' ? passwordResetLimiter : (req, res, next) => next(),
    async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token i hasło są wymagane.' });
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return res.status(400).json({ message: 'Token jest nieprawidłowy lub wygasł.' });
    }
    const user = await User.findByPk(payload.id);
    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
        return res.status(400).json({ message: 'Token jest nieprawidłowy lub wygasł.' });
    }
    user.password = await require('bcryptjs').hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.json({ message: 'Hasło zostało zmienione. Możesz się zalogować.' });
});

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

// Generuj sekret 2FA
router.post('/2fa/generate', userAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }

        const secret = speakeasy.generateSecret({
            name: `Cartechstore:${user.email}`
        });

        // Zapisz sekret tymczasowo (nie aktywuj jeszcze 2FA)
        await user.update({ temp2FASecret: secret.base32 });

        // Generuj QR kod
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            secret: secret.base32,
            qrCode
        });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Włącz 2FA
router.post('/2fa/enable', userAuth, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }

        if (!user.temp2FASecret) {
            return res.status(400).json({ message: 'Najpierw wygeneruj sekret 2FA.' });
        }

        // Sprawdź token
        const verified = speakeasy.totp.verify({
            secret: user.temp2FASecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(400).json({ message: 'Nieprawidłowy kod 2FA.' });
        }

        // Aktywuj 2FA
        await user.update({
            twoFactorSecret: user.temp2FASecret,
            temp2FASecret: null
        });

        res.json({ message: '2FA włączone pomyślnie.' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Wyłącz 2FA
router.post('/2fa/disable', userAuth, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA nie jest włączone.' });
        }

        // Sprawdź token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(400).json({ message: 'Nieprawidłowy kod 2FA.' });
        }

        // Wyłącz 2FA
        await user.update({
            twoFactorSecret: null,
            temp2FASecret: null
        });

        res.json({ message: '2FA wyłączone pomyślnie.' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Weryfikuj token 2FA przy logowaniu
router.post('/2fa/verify', async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA nie jest włączone.' });
        }

        // Sprawdź token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(400).json({ message: 'Nieprawidłowy kod 2FA.' });
        }

        // Generuj JWT
        const jwtToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Weryfikacja 2FA pomyślna.',
            token: jwtToken
        });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Sprawdź status 2FA
router.get('/2fa/status', userAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }

        res.json({
            enabled: !!user.twoFactorSecret
        });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// CSRF Token endpoint
router.get('/csrf-token', (req, res) => {
    res.json({ 
        success: true, 
        csrfToken: require('crypto').randomUUID() 
    });
});

// Email test endpoint (for admin only)
router.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email jest wymagany'
            });
        }

        const testEmailTemplate = {
            subject: '✅ Test Email - Cartechstore System',
            html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #10B981 60%, #059669 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">✅ Test Email</h1>
                <p style="color: #e0e7ef; font-size: 1.1rem; margin: 0;">System email działa poprawnie!</p>
              </div>
              <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">
                  Ten email potwierdza, że system email Cartechstore działa poprawnie.
                </p>
                <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                  <p style="margin: 0; font-size: 0.9rem; color: #64748b;">
                    <strong>Dane testowe:</strong><br>
                    Adres docelowy: ${email}<br>
                    Data wysłania: ${new Date().toLocaleString('pl-PL')}<br>
                    Status: ✅ Pomyślnie wysłany
                  </p>
                </div>
                <p style="font-size: 1.05rem; color: #64748b; margin-top: 2rem;">
                  System email funkcjonuje prawidłowo!
                </p>
              </div>
              <div style="background: #f1f5f9; padding: 1.2rem 2rem; text-align: center; color: #64748b; font-size: 0.98rem; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cartechstore - System B2B</p>
              </div>
            </div>
            `
        };
        
        const emailResult = await require('../utils/email').sendEmail(email, testEmailTemplate);
        
        res.status(200).json({
            success: true,
            message: `Email testowy został wysłany na adres: ${email}`,
            emailId: emailResult.id,
            simulated: emailResult.simulated || false
        });
        
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas wysyłania testowego emaila',
            error: error.message
        });
    }
});

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/api/auth/google/callback'
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     let user = await User.findOne({ where: { email: profile.emails[0].value } });
//     if (!user) {
//       user = await User.create({
//         email: profile.emails[0].value,
//         firstName: profile.name.givenName,
//         lastName: profile.name.familyName,
//         role: 'user',
//         isEmailVerified: true
//       });
//     }
//     return done(null, user);
//   } catch (err) {
//     return done(err);
//   }
// }));

// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_CLIENT_ID,
//   clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//   callbackURL: '/api/auth/facebook/callback',
//   profileFields: ['id', 'emails', 'name']
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     let user = await User.findOne({ where: { email: profile.emails[0].value } });
//     if (!user) {
//       user = await User.create({
//         email: profile.emails[0].value,
//         firstName: profile.name.givenName,
//         lastName: profile.name.familyName,
//         role: 'user',
//         isEmailVerified: true
//       });
//     }
//     return done(null, user);
//   } catch (err) {
//     return done(err);
//   }
// }));

// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
//   const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
//   res.redirect(`${process.env.FRONTEND_URL}/login-success.html?token=${token}`);
// });

// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), (req, res) => {
//   const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
//   res.redirect(`${process.env.FRONTEND_URL}/login-success.html?token=${token}`);
// });

// Logout endpoint
router.post('/logout', (req, res) => {
    try {
        // In a stateless JWT system, we just need to tell the client to remove the token
        // In production, you might want to implement a token blacklist
        res.json({ 
            success: true, 
            message: 'Wylogowano pomyślnie' 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd podczas wylogowania' 
        });
    }
});

module.exports = router;
