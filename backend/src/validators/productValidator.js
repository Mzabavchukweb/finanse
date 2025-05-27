const { body } = require('express-validator');

const createProductValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Nazwa produktu jest wymagana')
        .isLength({ min: 3, max: 100 })
        .withMessage('Nazwa produktu musi mieć od 3 do 100 znaków'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Opis produktu jest wymagany')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Opis produktu musi mieć od 10 do 1000 znaków'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Cena musi być liczbą dodatnią'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stan magazynowy musi być liczbą całkowitą nieujemną'),
    body('categoryId')
        .isInt()
        .withMessage('Kategoria jest wymagana'),
    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Slug jest wymagany')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug może zawierać tylko małe litery, cyfry i myślniki')
];

const updateProductValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Nazwa produktu musi mieć od 3 do 100 znaków'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Opis produktu musi mieć od 10 do 1000 znaków'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cena musi być liczbą dodatnią'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stan magazynowy musi być liczbą całkowitą nieujemną'),
    body('categoryId')
        .optional()
        .isInt()
        .withMessage('Kategoria musi być poprawnym ID'),
    body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug może zawierać tylko małe litery, cyfry i myślniki')
];

module.exports = {
    createProductValidation,
    updateProductValidation
};
