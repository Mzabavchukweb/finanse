const { body } = require('express-validator');

const validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain uppercase letter, lowercase letter, number and special character'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-']+$/)
        .withMessage('First name contains invalid characters'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-']+$/)
        .withMessage('Last name contains invalid characters'),
    body('companyName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Company name is too long'),
    body('nip')
        .optional()
        .trim()
        .matches(/^\d{10}$/)
        .withMessage('NIP must be 10 digits'),
    body('phone')
        .optional()
        .trim()
        .matches(/^(\+48\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{9})$/)
        .withMessage('Invalid phone number format')
];

const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 1, max: 128 })
        .withMessage('Password length is invalid')
];

module.exports = {
    validateRegistration,
    validateLogin
};
