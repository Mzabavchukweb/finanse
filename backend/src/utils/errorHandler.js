const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./email');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const handleSequelizeError = (err) => {
    if (err.name === 'SequelizeUniqueConstraintError') {
        return new AppError('Ten adres email lub NIP jest już zarejestrowany', 400);
    }
    if (err.name === 'SequelizeValidationError') {
        const message = err.errors.map(e => e.message).join('. ');
        return new AppError(message, 400);
    }
    return err;
};

const handleJWTError = () =>
    new AppError('Nieprawidłowy token. Zaloguj się ponownie.', 401);

const handleJWTExpiredError = () =>
    new AppError('Twoja sesja wygasła. Zaloguj się ponownie.', 401);

const logError = (err, req) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack,
        user: req.user ? req.user.id : 'anonymous'
    };

    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    fs.appendFileSync(
        path.join(logDir, 'error.log'),
        JSON.stringify(errorLog) + '\n'
    );
};

const sendErrorEmail = async (err, req) => {
    if (err.statusCode >= 500) {
        await sendEmail(
            process.env.ADMIN_EMAIL,
            {
                subject: 'Krytyczny błąd aplikacji',
                html: `
          <h2>Wystąpił krytyczny błąd</h2>
          <p><strong>Ścieżka:</strong> ${req.path}</p>
          <p><strong>Metoda:</strong> ${req.method}</p>
          <p><strong>Błąd:</strong> ${err.message}</p>
          <p><strong>Stack:</strong> ${err.stack}</p>
          <p><strong>Użytkownik:</strong> ${req.user ? req.user.id : 'anonymous'}</p>
        `
            }
        );
    }
};

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Logowanie błędu
    logError(err, req);

    // Wysyłanie maila dla krytycznych błędów
    sendErrorEmail(err, req);

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
    // Produkcja
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // Błędy programistyczne
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Coś poszło nie tak!'
            });
        }
    }
};

module.exports = {
    AppError,
    handleSequelizeError,
    handleJWTError,
    handleJWTExpiredError,
    errorHandler
};
