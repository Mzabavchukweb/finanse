const verifyRecaptcha = async (req, res, next) => {
    try {
        const { recaptchaToken } = req.body;

        if (!recaptchaToken) {
            return res.status(400).json({ error: 'Token reCAPTCHA jest wymagany' });
        }

        // W środowisku testowym zawsze zwracamy sukces
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        });

        const data = await response.json();

        if (!data.success) {
            return res.status(400).json({ error: 'reCAPTCHA jest wymagane' });
        }

        next();
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        res.status(500).json({ error: 'Błąd weryfikacji reCAPTCHA' });
    }
};

module.exports = verifyRecaptcha;
