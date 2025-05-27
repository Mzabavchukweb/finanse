const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
    // W trybie testowym pomijamy weryfikację reCAPTCHA
    if (process.env.NODE_ENV === 'test') {
        return next();
    }

    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.status(400).json({
            error: 'Token reCAPTCHA jest wymagany'
        });
    }

    try {
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: recaptchaToken
                }
            }
        );

        if (!response.data.success) {
            return res.status(400).json({
                error: 'Weryfikacja reCAPTCHA nie powiodła się'
            });
        }

        next();
    } catch (error) {
        console.error('Błąd weryfikacji reCAPTCHA:', error);
        res.status(500).json({
            error: 'Błąd podczas weryfikacji reCAPTCHA'
        });
    }
};

module.exports = verifyRecaptcha;
