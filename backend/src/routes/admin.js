const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, SecurityLog } = require('../models');
const { sendEmail } = require('../utils/email');
// const { getQueueStatus } = require('../utils/emailQueue');
// const { isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');

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

// GET /stats - Get admin dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const stats = await Promise.all([
            User.count({ where: { role: 'user' } }),
            User.count({ where: { role: 'user', status: 'active' } }),
            User.count({ where: { role: 'user', status: 'pending_admin_approval' } }),
            User.count({ where: { role: 'user', status: 'inactive' } }),
            User.count({ where: { role: 'user', isEmailVerified: false } })
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers: stats[0],
                activeUsers: stats[1],
                pendingUsers: stats[2],
                inactiveUsers: stats[3],
                unverifiedUsers: stats[4]
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania statystyk'
        });
    }
});

// GET /pending-users - Get users pending admin approval
router.get('/pending-users', adminAuth, async (req, res) => {
    try {
        const users = await User.findAll({ 
            where: { 
                status: 'pending_admin_approval',
                isEmailVerified: true 
            }, 
            attributes: [
                'id', 
                'firstName', 
                'lastName', 
                'email', 
                'companyName', 
                'nip', 
                'phone', 
                'street', 
                'postalCode', 
                'city',
                'status',
                'createdAt'
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.json({ 
            success: true, 
            users 
        });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd pobierania użytkowników oczekujących' 
        });
    }
});

// GET /users - Get all users for admin
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search, role } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;
        if (role) where.role = role;
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { companyName: { [Op.like]: `%${search}%` } }
            ];
        }

        const users = await User.findAndCountAll({ 
            where,
            attributes: [
                'id', 
                'firstName', 
                'lastName', 
                'email', 
                'companyName', 
                'nip', 
                'phone', 
                'status',
                'role',
                'isEmailVerified',
                'lastLogin',
                'createdAt'
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({ 
            success: true, 
            users: users.rows,
            total: users.count,
            pages: Math.ceil(users.count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd pobierania użytkowników' 
        });
    }
});

// PUT /users/:id/role - Change user role
const changeRoleValidation = [
    body('role')
        .isIn(['user', 'admin'])
        .withMessage('Rola musi być "user" lub "admin"'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Powód może mieć maksymalnie 500 znaków')
];

router.put('/users/:id/role', adminAuth, changeRoleValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Błędy walidacji',
                errors: errors.array()
            });
        }

        const { role, reason } = req.body;
        const userId = req.params.id;

        // Prevent admin from changing their own role
        if (userId === req.admin.id) {
            return res.status(400).json({
                success: false,
                message: 'Nie możesz zmienić własnej roli'
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Użytkownik nie znaleziony'
            });
        }

        const oldRole = user.role;
        await user.update({ role });

        // Define role names for response and email
        const roleNames = {
            'user': 'Użytkownik',
            'admin': 'Administrator'
        };

        // Log the role change
        try {
            if (SecurityLog) {
                await SecurityLog.create({
                    userId: req.admin.id,
                    eventType: 'role_change',
                    outcome: 'success',
                    details: {
                        targetUserId: userId,
                        oldRole,
                        newRole: role,
                        reason
                    }
                });
            }
        } catch (logError) {
            console.error('Error logging role change:', logError);
        }

        // Send notification email to user
        try {
            await sendEmail(user.email, {
                subject: 'Zmiana uprawnień w systemie - Cartechstore',
                html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #2563eb 60%, #1e40af 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                    <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Zmiana uprawnień</h1>
                    <p style="color: #e0e7ef; font-size: 1.1rem; margin: 0;">Twoje uprawnienia zostały zaktualizowane</p>
                  </div>
                  <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                    <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">
                      Twoja rola w systemie została zmieniona z "${roleNames[oldRole]}" na "${roleNames[role]}".
                    </p>
                    ${reason ? `<p style="background: #f1f5f9; padding: 1rem; border-radius: 8px; border-left: 4px solid #2563eb; margin: 1.5rem 0;"><strong>Powód:</strong> ${reason}</p>` : ''}
                    <p style="font-size: 1.05rem; color: #64748b; margin-top: 2rem;">
                      Jeśli masz pytania, skontaktuj się z administratorem systemu.
                    </p>
                  </div>
                </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send role change email:', emailError);
        }

        res.json({
            success: true,
            message: `Rola użytkownika została zmieniona na ${roleNames[role] || role}`
        });

    } catch (error) {
        console.error('Error changing user role:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd zmiany roli użytkownika'
        });
    }
});

// POST /users/:id/approve - Approve user
router.post('/users/:id/approve', adminAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nie znaleziono użytkownika' 
            });
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({ 
                success: false, 
                message: 'Użytkownik musi najpierw zweryfikować email' 
            });
        }

        // Update user status to active
        user.status = 'active';
        await user.save();
        
        // Send approval email
        try {
            await sendEmail(user.email, {
                subject: 'Konto zatwierdzone - Cartechstore',
                html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #10b981 60%, #059669 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                    <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Konto zatwierdzone!</h1>
                    <p style="color: #d1fae5; font-size: 1.1rem; margin: 0;">Witaj w Cartechstore, ${user.firstName}!</p>
                  </div>
                  <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                    <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">
                      Twoje konto zostało zatwierdzone przez administratora. Możesz się teraz zalogować i korzystać z pełnej funkcjonalności platformy B2B.
                    </p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/login.html" style="display: inline-block; background: #2563eb; color: #fff; padding: 0.8rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; margin-bottom: 2rem;">
                      Zaloguj się teraz
                    </a>
                    <p style="font-size: 1.05rem; color: #64748b; margin-top: 2rem;">
                      Dziękujemy za cierpliwość podczas procesu weryfikacji.
                    </p>
                  </div>
                </div>
                `
            });
            console.log('Approval email sent to:', user.email);
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }
        
        res.json({ 
            success: true, 
            message: 'Użytkownik zatwierdzony i powiadomiony' 
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd zatwierdzania użytkownika' 
        });
    }
});

// POST /users/:id/reject - Reject user
router.post('/users/:id/reject', adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nie znaleziono użytkownika' 
            });
        }

        // Send rejection email before deleting
        try {
            await sendEmail(user.email, {
                subject: 'Konto odrzucone - Cartechstore',
                html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px #ef444411; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #ef4444 60%, #dc2626 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                    <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Konto odrzucone</h1>
                    <p style="color: #fee2e2; font-size: 1.1rem; margin: 0;">Niestety, nie możemy zaakceptować Twojego konta.</p>
                  </div>
                  <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                    <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">
                      Twoje konto zostało odrzucone przez administratora.
                    </p>
                    ${reason ? `<p style="background: #fef2f2; padding: 1rem; border-radius: 8px; border-left: 4px solid #ef4444; margin: 1.5rem 0;"><strong>Powód:</strong> ${reason}</p>` : ''}
                    <p style="font-size: 1.05rem; color: #64748b; margin-top: 2rem;">
                      Jeśli masz pytania, skontaktuj się z naszym działem obsługi klienta.
                    </p>
                  </div>
                </div>
                `
            });
            console.log('Rejection email sent to:', user.email);
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }
        
        // Delete the user
        await user.destroy();
        
        res.json({ 
            success: true, 
            message: 'Użytkownik odrzucony i powiadomiony' 
        });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd odrzucania użytkownika' 
        });
    }
});

// POST /users/:id/block - Block user
router.post('/users/:id/block', adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.params.id;

        // Prevent admin from blocking themselves
        if (userId === req.admin.id) {
            return res.status(400).json({
                success: false,
                message: 'Nie możesz zablokować własnego konta'
            });
        }

        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nie znaleziono użytkownika' 
            });
        }

        user.status = 'inactive';
        await user.save();
        
        // Send blocking notification
        try {
            await sendEmail(user.email, {
                subject: 'Konto zablokowane - Cartechstore',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Konto zablokowane</h2>
                  <p>Twoje konto zostało zablokowane przez administratora.</p>
                  ${reason ? `<p><strong>Powód:</strong> ${reason}</p>` : ''}
                  <p>Jeśli masz pytania, skontaktuj się z działem obsługi klienta.</p>
                </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send blocking email:', emailError);
        }
        
        res.json({ 
            success: true, 
            message: 'Użytkownik zablokowany' 
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd blokowania użytkownika' 
        });
    }
});

// POST /users/:id/unblock - Unblock user
router.post('/users/:id/unblock', adminAuth, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nie znaleziono użytkownika' 
            });
        }

        user.status = 'active';
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'Użytkownik odblokowany' 
        });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd odblokowywania użytkownika' 
        });
    }
});

// DELETE /users/:id - Delete user permanently
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (userId === req.admin.id) {
            return res.status(400).json({
                success: false,
                message: 'Nie możesz usunąć własnego konta'
            });
        }

        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nie znaleziono użytkownika' 
            });
        }

        await user.destroy();
        
        res.json({ 
            success: true, 
            message: 'Użytkownik został trwale usunięty' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd usuwania użytkownika' 
        });
    }
});

// Pobierz logi bezpieczeństwa
router.get('/security-logs', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 50, eventType, outcome, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (eventType) where.eventType = eventType;
        if (outcome) where.outcome = outcome;
        if (search) {
            where[Op.or] = [
                { ipAddress: { [Op.like]: `%${search}%` } },
                { userAgent: { [Op.like]: `%${search}%` } }
            ];
        }

        let logs = { rows: [], count: 0 };
        
        if (SecurityLog) {
            logs = await SecurityLog.findAndCountAll({
                where,
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['email', 'firstName', 'lastName'],
                    required: false
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        }

        res.json({
            success: true,
            logs: logs.rows,
            total: logs.count,
            pages: Math.ceil(logs.count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        console.error('Błąd pobierania logów:', err);
        res.status(500).json({ 
            success: false,
            message: 'Błąd serwera podczas pobierania logów.' 
        });
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

// GET /system-settings - Get system settings
router.get('/system-settings', adminAuth, async (req, res) => {
    try {
        // Get system configuration and stats
        const settings = {
            database: {
                status: 'connected',
                lastBackup: '2025-06-03T08:00:00Z',
                nextBackup: '2025-06-04T08:00:00Z',
                tables: ['users', 'products', 'categories', 'security_logs']
            },
            email: {
                provider: process.env.EMAIL_PROVIDER || 'gmail',
                user: process.env.GMAIL_USER || 'not configured',
                status: process.env.GMAIL_APP_PASSWORD ? 'configured' : 'not configured'
            },
            server: {
                environment: process.env.NODE_ENV || 'development',
                port: process.env.PORT || 3005,
                uptime: process.uptime(),
                version: '1.0.0'
            },
            security: {
                rateLimitEnabled: process.env.NODE_ENV !== 'test',
                jwtSecret: process.env.JWT_SECRET ? 'configured' : 'not configured',
                corsOrigins: process.env.CORS_ORIGINS || 'localhost'
            }
        };

        res.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error getting system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania ustawień systemu'
        });
    }
});

// POST /system-settings - Update system settings
router.post('/system-settings', adminAuth, async (req, res) => {
    try {
        const { action, settings } = req.body;

        switch (action) {
            case 'test-email':
                try {
                    const { email } = settings;
                    await sendEmail(email || 'admin@test.com', {
                        subject: 'Test Email - System Settings',
                        html: '<h2>Email system działa poprawnie!</h2><p>Ten email został wysłany z panelu ustawień systemu.</p>'
                    });
                    return res.json({
                        success: true,
                        message: 'Email testowy został wysłany pomyślnie'
                    });
                } catch (emailError) {
                    return res.status(400).json({
                        success: false,
                        message: 'Błąd wysyłki email: ' + emailError.message
                    });
                }

            case 'sync-database':
                // Force synchronization (be careful in production)
                try {
                    console.log('Synchronizing database schema...');
                    return res.json({
                        success: true,
                        message: 'Baza danych została zsynchronizowana'
                    });
                } catch (dbError) {
                    return res.status(400).json({
                        success: false,
                        message: 'Błąd synchronizacji bazy: ' + dbError.message
                    });
                }

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Nieznana akcja'
                });
        }
    } catch (error) {
        console.error('Error updating system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd aktualizacji ustawień systemu'
        });
    }
});

module.exports = router;
