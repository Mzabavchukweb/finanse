const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, SecurityLog } = require('../models');
const nodemailer = require('nodemailer');
// const { getQueueStatus } = require('../utils/emailQueue');
// const { isAdmin } = require('../middleware/auth');

// Middleware: sprawdź JWT i rolę admina
function adminAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Brak tokena.' });
    try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'Brak uprawnień.' });
        req.admin = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Nieprawidłowy token.' });
    }
}

// Transporter do maili
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// GET /pending-users
router.get('/pending-users', adminAuth, async (req, res) => {
    const users = await User.findAll({ where: { isVerified: false }, attributes: ['id', 'firstName', 'lastName', 'email', 'companyName'] });
    res.json(users);
});

// POST /pending-users/:id/approve
router.post('/pending-users/:id/approve', adminAuth, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
    user.isVerified = true;
    await user.save();
    // Wyślij email o akceptacji
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Konto zatwierdzone - Cartechstore',
        html: '<p>Twoje konto zostało zatwierdzone przez administratora. Możesz się już logować i korzystać z platformy.</p>'
    });
    res.json({ message: 'Użytkownik zatwierdzony i powiadomiony.' });
});

// POST /pending-users/:id/reject
router.post('/pending-users/:id/reject', adminAuth, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Konto odrzucone - Cartechstore',
        html: '<p>Twoje konto zostało odrzucone przez administratora. W razie pytań skontaktuj się z nami.</p>'
    });
    await user.destroy();
    res.json({ message: 'Użytkownik odrzucony i powiadomiony.' });
});

// Pobierz logi bezpieczeństwa
router.get('/security-logs', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 50, eventType, userId } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (eventType) where.eventType = eventType;
        if (userId) where.userId = userId;

        const logs = await SecurityLog.findAndCountAll({
            where,
            include: [{
                model: User,
                attributes: ['email']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            logs: logs.rows,
            total: logs.count,
            pages: Math.ceil(logs.count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        console.error('Błąd pobierania logów:', err);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Get email queue status
// router.get('/email-queue/status', isAdmin, async (req, res) => {
//   try {
//     const status = await getQueueStatus();
//     res.json({
//       success: true,
//       data: {
//         ...status,
//         timestamp: new Date().toISOString()
//       }
//     });
//   } catch (error) {
//     console.error('Error getting queue status:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get queue status'
//     });
//   }
// });

// Get failed emails
// router.get('/email-queue/failed', isAdmin, async (req, res) => {
//   try {
//     const failedJobs = await emailQueue.getFailed();
//     const failedEmails = failedJobs.map(job => ({
//       id: job.id,
//       to: job.data.to,
//       error: job.failedReason,
//       failedAt: job.failedOn,
//       attempts: job.attemptsMade
//     }));
//
//     res.json({
//       success: true,
//       data: failedEmails
//     });
//   } catch (error) {
//     console.error('Error getting failed emails:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get failed emails'
//     });
//   }
// });

// Retry failed email
// router.post('/email-queue/retry/:jobId', isAdmin, async (req, res) => {
//   try {
//     const { jobId } = req.params;
//     const job = await emailQueue.getJob(jobId);
//
//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         error: 'Job not found'
//       });
//     }
//
//     await job.retry();
//     res.json({
//       success: true,
//       message: 'Job queued for retry'
//     });
//   } catch (error) {
//     console.error('Error retrying job:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to retry job'
//     });
//   }
// });

// Clear failed jobs
// router.delete('/email-queue/failed', isAdmin, async (req, res) => {
//   try {
//     await emailQueue.clean(0, 'failed');
//     res.json({
//       success: true,
//       message: 'Failed jobs cleared'
//     });
//   } catch (error) {
//     console.error('Error clearing failed jobs:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to clear failed jobs'
//     });
//   }
// });

module.exports = router;
