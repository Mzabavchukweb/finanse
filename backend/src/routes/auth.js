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
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;

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
router.post('/register', validateRegistration, async (req, res) => {
    console.log('Odebrano POST /api/auth/register');
    try {
    // --- reCAPTCHA VALIDATION ---
    // Tymczasowo wyłączone dla testów
    /*
    const recaptchaToken = req.body.recaptchaToken;
    if (!recaptchaToken) {
      return res.status(400).json({ message: 'reCAPTCHA jest wymagane.' });
    }
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ message: 'Brak konfiguracji reCAPTCHA.' });
    }
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaToken}`;
    const recaptchaRes = await axios.post(verifyUrl);
    if (!recaptchaRes.data.success) {
      return res.status(400).json({ message: 'Weryfikacja reCAPTCHA nie powiodła się.' });
    }
    */
        // --- END reCAPTCHA ---

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
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
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            companyName,
            companyCountry,
            nip,
            phone,
            street: address?.street,
            postalCode: address?.postalCode,
            city: address?.city,
            role: 'user',
            isVerified: false
        });

        // --- GENERUJ TOKEN I WYŚLIJ EMAIL AKTYWACYJNY ---
        const emailVerificationToken = require('crypto').randomBytes(32).toString('hex');
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
        await user.save();
        const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification-pending.html?token=${emailVerificationToken}`;
        const emailTemplate = {
            subject: 'Aktywacja konta - Cartechstore',
            html: `<h2>Witaj ${user.firstName || ''}!</h2><p>Dziękujemy za rejestrację w Cartechstore.</p><p>Aby aktywować swoje konto, kliknij w poniższy link:</p><a href='${activationLink}'>Aktywuj konto</a><p>Link jest ważny przez 24 godziny.</p>`
        };
        if (user.email && emailTemplate.subject && emailTemplate.html) {
            await require('../utils/email').sendEmail(user.email, emailTemplate);
        } else {
            console.error('Nieprawidłowe dane do wysyłki emaila:', user.email, emailTemplate);
            throw new Error('Nieprawidłowe dane do wysyłki emaila');
        }
        // --- KONIEC EMAILA AKTYWACYJNEGO ---

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                companyName: user.companyName,
                companyCountry: user.companyCountry,
                nip: user.nip,
                phone: user.phone,
                street: user.street,
                postalCode: user.postalCode,
                city: user.city,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
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
router.post('/login', async (req, res) => {
    try {
        const { email, password, recaptchaResponse } = req.body;

        // Sprawdź reCAPTCHA
        const isRecaptchaValid = await verifyRecaptcha(recaptchaResponse);
        if (!isRecaptchaValid) {
            await securityLogger.logSuspiciousActivity(req, {
                type: 'invalid_recaptcha',
                email
            });
            return res.status(400).json({ message: 'Weryfikacja reCAPTCHA nie powiodła się.' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            await securityLogger.logLoginFailure(req, email, 'user_not_found');
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
        }

        // Blokada logowania dla nieaktywnych kont
        if (!user.isEmailVerified && user.emailVerificationToken) {
            return res.status(403).json({ message: 'Konto nie zostało aktywowane. Sprawdź email i kliknij w link aktywacyjny.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            await securityLogger.logLoginFailure(req, email, 'invalid_password');
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
        }

        if (user.status === 'blocked') {
            await securityLogger.logLoginFailure(req, email, 'account_blocked');
            return res.status(403).json({ message: 'Konto jest zablokowane.' });
        }

        // Jeśli użytkownik ma włączone 2FA
        if (user.twoFactorSecret) {
            // Generuj tymczasowy token
            const tempToken = jwt.sign(
                { id: user.id, email: user.email, temp: true },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            await securityLogger.logLoginSuccess(req, user);
            return res.json({
                requires2FA: true,
                tempToken
            });
        }

        // Standardowe logowanie
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await securityLogger.logLoginSuccess(req, user);
        res.json({ token });
    } catch (err) {
        console.error('Błąd logowania:', err);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Weryfikacja emaila
router.get('/verify-email/:token', verifyEmail);

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

// RESET PASSWORD - GENERATE TOKEN & SEND EMAIL
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email jest wymagany.' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).json({ message: 'Jeśli email istnieje, wysłaliśmy link do resetu hasła.' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/reset-password.html?token=${token}`;
    // Wyślij maila
    const transporter = require('nodemailer').createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Resetowanie hasła - Cartechstore',
        html: `<p>Kliknij w link, aby zresetować hasło: <a href='${resetUrl}'>Resetuj hasło</a></p>`
    });
    res.json({ message: 'Jeśli email istnieje, wysłaliśmy link do resetu hasła.' });
});

// RESET PASSWORD - SET NEW PASSWORD
router.post('/reset-password', async (req, res) => {
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

// Admin login
router.post('/admin-login', adminLoginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('ADMIN LOGIN: email:', email, 'password:', password);
        const user = await User.findOne({ where: { email } });
        console.log('Znaleziony user:', user ? user.toJSON() : null);
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'Brak dostępu.' });
        }
        const isValidPassword = await user.validatePassword(password);
        console.log('isValidPassword:', isValidPassword);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Nieprawidłowe dane logowania.' });
        }
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'Logowanie administratora udane',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Błąd logowania administratora.' });
    }
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

module.exports = router;
