const { AppError } = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Logowanie błędu
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

    // Wysyłanie odpowiedzi
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

module.exports = errorHandler;
