const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Lista użytkowników wg statusu
router.get('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.getUsers);
// Historia/logi
router.get('/:id/logs', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.getUserLogs);

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

// DELETE /account - Delete user account (soft delete) - MUST be before /:id route
router.delete('/account', userAuth, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Hasło jest wymagane do usunięcia konta'
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Użytkownik nie znaleziony'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowe hasło'
            });
        }

        // Soft delete - change status to inactive and anonymize data
        await user.update({
            status: 'inactive',
            email: `deleted_${user.id}@deleted.com`,
            firstName: 'Usunięty',
            lastName: 'Użytkownik',
            phone: null,
            companyName: null,
            nip: null,
            street: null,
            city: null,
            postalCode: null
        });

        res.json({
            success: true,
            message: 'Konto zostało usunięte'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd usuwania konta'
        });
    }
});

// Usuwanie - admin only
router.delete('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.deleteUser);

// Dodaj router dla pending-users:
const pendingRouter = express.Router();
pendingRouter.patch('/:id/accept', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.acceptPendingUser);
pendingRouter.patch('/:id/reject', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.rejectPendingUser);

// Pobierz profil użytkownika
router.get('/profile', userAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: [
                'id', 'firstName', 'lastName', 'email', 'companyName', 
                'nip', 'phone', 'street', 'postalCode', 'city', 
                'companyCountry', 'role', 'status', 'createdAt', 'lastLogin'
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Użytkownik nie znaleziony'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania profilu'
        });
    }
});

// Aktualizuj profil użytkownika
const updateProfileValidation = [
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('Imię jest wymagane')
        .isLength({ min: 2, max: 50 })
        .withMessage('Imię musi mieć od 2 do 50 znaków'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Nazwisko jest wymagane')
        .isLength({ min: 2, max: 50 })
        .withMessage('Nazwisko musi mieć od 2 do 50 znaków'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Nieprawidłowy format email'),
    body('companyName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Nazwa firmy może mieć maksymalnie 100 znaków'),
    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9\s-]{9,15}$/)
        .withMessage('Nieprawidłowy format telefonu'),
    body('street')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Ulica może mieć maksymalnie 100 znaków'),
    body('city')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Miasto może mieć maksymalnie 50 znaków'),
    body('postalCode')
        .optional()
        .trim()
        .matches(/^\d{2}-\d{3}$/)
        .withMessage('Kod pocztowy musi być w formacie XX-XXX')
];

router.put('/profile', userAuth, updateProfileValidation, async (req, res) => {
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
            firstName,
            lastName,
            email,
            companyName,
            phone,
            street,
            city,
            postalCode
        } = req.body;

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Użytkownik nie znaleziony'
            });
        }

        // Check if email is already taken by another user
        if (email !== user.email) {
            const existingUser = await User.findOne({
                where: {
                    email,
                    id: { [Op.ne]: req.user.id }
                }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Ten adres email jest już używany przez innego użytkownika'
                });
            }
        }

        // Update user data
        await user.update({
            firstName,
            lastName,
            email,
            companyName,
            phone,
            street,
            city,
            postalCode
        });

        // Return updated user data
        const updatedUser = await User.findByPk(req.user.id, {
            attributes: [
                'id', 'firstName', 'lastName', 'email', 'companyName', 
                'nip', 'phone', 'street', 'postalCode', 'city', 
                'companyCountry', 'role', 'status', 'updatedAt'
            ]
        });

        res.json({
            success: true,
            message: 'Profil został zaktualizowany',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd aktualizacji profilu'
        });
    }
});

// PUT /change-password - Change user password
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Aktualne hasło jest wymagane'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Nowe hasło musi mieć minimum 8 znaków')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Nowe hasło musi zawierać wielkie litery, małe litery, cyfry i znaki specjalne'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Potwierdzenie hasła nie pasuje do nowego hasła');
            }
            return true;
        })
];

router.put('/change-password', userAuth, changePasswordValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Błędy walidacji',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Użytkownik nie znaleziony'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Aktualne hasło jest nieprawidłowe'
            });
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'Nowe hasło musi być różne od aktualnego'
            });
        }

        // Hash and save new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await user.save({ fields: ['password'], validate: false, hooks: false });

        res.json({
            success: true,
            message: 'Hasło zostało pomyślnie zmienione'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd zmiany hasła'
        });
    }
});

module.exports = { router, pendingRouter };
