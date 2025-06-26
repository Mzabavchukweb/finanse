const { SecurityLog } = require('../models');

const create = async (logData) => {
    try {
        const log = await SecurityLog.create(logData);
        return log;
    } catch (err) {
        console.error('Błąd logowania zdarzenia bezpieczeństwa:', err);
        return null;
    }
};

const logSecurityEvent = async (req, eventType, details, outcome = 'success') => {
    try {
        const logData = {
            eventType,
            outcome,
            ipAddress: req.ip,
            userAgent: req.headers && req.headers['user-agent'] ? req.headers['user-agent'] : 'test-agent',
            details: JSON.stringify(details)
        };

        if (req.user) {
            logData.userId = req.user.id;
        }

        await create(logData);
    } catch (err) {
        console.error('Błąd logowania zdarzenia bezpieczeństwa:', err);
    }
};

const securityLogger = {
    logLoginSuccess: async (req, user) => {
        await logSecurityEvent(req, 'login_success', { email: user.email }, 'success');
    },

    logLoginFailure: async (req, email, reason) => {
        await logSecurityEvent(req, 'login_failure', { email, reason }, 'failure');
    },

    logPasswordChange: async (req, user) => {
        await logSecurityEvent(req, 'password_change', { email: user.email }, 'success');
    },

    log2FAEnabled: async (req, user) => {
        await logSecurityEvent(req, '2fa_enabled', { email: user.email }, 'success');
    },

    log2FADisabled: async (req, user) => {
        await logSecurityEvent(req, '2fa_disabled', { email: user.email }, 'success');
    },

    logAccountLocked: async (req, user, reason) => {
        await logSecurityEvent(req, 'account_locked', { email: user.email, reason }, 'success');
    },

    logAccountUnlocked: async (req, user) => {
        await logSecurityEvent(req, 'account_unlocked', { email: user.email }, 'success');
    },

    logSuspiciousActivity: async (req, details) => {
        await logSecurityEvent(req, 'suspicious_activity', details, 'detected');
    }
};

module.exports = securityLogger;
