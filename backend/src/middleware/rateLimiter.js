const rateLimit = require('express-rate-limit');

// Rate limiter dla autoryzacji
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 5, // 5 prób
    message: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter dla rejestracji
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 godzina
    max: 3, // 3 próby
    message: 'Zbyt wiele prób rejestracji. Spróbuj ponownie za godzinę.',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter dla resetowania hasła
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 godzina
    max: 3, // 3 próby
    message: 'Zbyt wiele prób resetowania hasła. Spróbuj ponownie za godzinę.',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter dla API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 100, // 100 requestów
    message: 'Zbyt wiele requestów. Spróbuj ponownie za 15 minut.',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter dla admina
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 50, // 50 requestów
    message: 'Zbyt wiele requestów do panelu admina. Spróbuj ponownie za 15 minut.',
    standardHeaders: true,
    legacyHeaders: false
});

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 100, // limit na IP
    message: 'Za dużo żądań z tego IP, spróbuj ponownie później.'
});

module.exports = {
    authLimiter,
    registerLimiter,
    passwordResetLimiter,
    apiLimiter,
    adminLimiter,
    rateLimiter
};
