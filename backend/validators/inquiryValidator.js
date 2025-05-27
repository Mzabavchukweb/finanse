const { body, param } = require('express-validator');

const createInquiryValidation = [
    body('productId')
        .isInt()
        .withMessage('Nieprawidłowy format ID produktu'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Ilość musi być liczbą całkowitą większą od 0'),
    body('message')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Wiadomość nie może przekraczać 1000 znaków')
];

const updateInquiryValidation = [
    param('id')
        .isInt()
        .withMessage('Nieprawidłowy format ID zapytania'),
    body('status')
        .isIn(['pending', 'responded', 'accepted', 'rejected'])
        .withMessage('Nieprawidłowy status zapytania'),
    body('adminResponse')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Odpowiedź nie może przekraczać 2000 znaków'),
    body('adminPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cena musi być liczbą dodatnią')
];

const getInquiryValidation = [
    param('id')
        .isInt()
        .withMessage('Nieprawidłowy format ID zapytania')
];

module.exports = {
    createInquiryValidation,
    updateInquiryValidation,
    getInquiryValidation
};
