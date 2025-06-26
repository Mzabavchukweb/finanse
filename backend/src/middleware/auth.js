const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const models = require('../models');
const { User } = models;

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Nie jesteś zalogowany. Zaloguj się, aby uzyskać dostęp.' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Nie jesteś zalogowany. Zaloguj się, aby uzyskać dostęp.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'Nie jesteś zalogowany. Zaloguj się, aby uzyskać dostęp.' });
            }

            if (user.isActive === false && user.role !== 'admin') {
                return res.status(401).json({ message: 'Twoje konto jest nieaktywne. Skontaktuj się z administratorem.' });
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Nieprawidłowy token. Zaloguj się ponownie.' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token wygasł. Zaloguj się ponownie.' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas weryfikacji autoryzacji.' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Nie masz uprawnień do wykonania tej operacji.' });
        }
        next();
    };
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Brak uprawnień' });
        }
        next();
    };
};

const isVerified = async (req, res, next) => {
    if (!req.user.isEmailVerified) {
        return res.status(403).json({ message: 'Zweryfikuj swój email przed kontynuowaniem.' });
    }
    next();
};

const isApproved = async (req, res, next) => {
    if (req.user.status !== 'active') {
        return res.status(403).json({ message: 'Twoje konto oczekuje na zatwierdzenie przez administratora.' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Brak dostępu. Wymagane uprawnienia administratora' });
    }
    next();
};

const protect = auth;

module.exports = { auth, authorize, isVerified, isApproved, protect, restrictTo, requireAdmin };
