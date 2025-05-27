const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Lista użytkowników wg statusu
router.get('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.getUsers);
// Usuwanie
router.delete('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.deleteUser);
// Historia/logi
router.get('/:id/logs', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.getUserLogs);

// Dodaj router dla pending-users:
const pendingRouter = express.Router();
pendingRouter.patch('/:id/accept', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.acceptPendingUser);
pendingRouter.patch('/:id/reject', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.rejectPendingUser);

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

// Pobierz profil użytkownika
router.get('/profile', userAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'name', 'phone', 'address']
        });
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Aktualizuj profil użytkownika
router.put('/profile', userAuth, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
        }

        await user.update({
            name: name || user.name,
            phone: phone || user.phone,
            address: address || user.address
        });

        res.json({
            message: 'Profil zaktualizowany pomyślnie.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

module.exports = { router, pendingRouter };
