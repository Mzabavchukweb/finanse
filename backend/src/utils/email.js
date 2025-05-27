const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter object
const createTransporter = () => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Verify transporter configuration
    transporter.verify((error, success) => {
        if (error) {
            logger.error('Email transporter verification failed:', error);
        } else {
            logger.info('Email transporter is ready to send messages');
        }
    });

    return transporter;
};

const transporter = createTransporter();

// Main email sending function
const sendEmail = async (to, { subject, html }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `Cartechstore <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Email templates
const getVerificationEmailTemplate = (name, link) => ({
    subject: 'Weryfikacja adresu email - Cartechstore',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Witaj ${name || ''}!</h2>
      <p>Dziękujemy za rejestrację w systemie Cartechstore B2B.</p>
      <p>Aby aktywować swoje konto, kliknij w poniższy link:</p>
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">Aktywuj konto</a>
      <p>Link jest ważny przez 24 godziny.</p>
      <p>Jeśli nie rejestrowałeś się w naszym systemie, zignoruj tego emaila.</p>
    </div>
  `
});

const getPasswordResetTemplate = (name, link) => ({
    subject: 'Reset hasła - Cartechstore',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Witaj ${name || ''}!</h2>
      <p>Otrzymaliśmy prośbę o reset hasła do Twojego konta.</p>
      <p>Kliknij w poniższy link, aby zresetować hasło:</p>
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">Resetuj hasło</a>
      <p>Link jest ważny przez 1 godzinę.</p>
      <p>Jeśli nie prosiłeś o reset hasła, zignoruj tego emaila.</p>
    </div>
  `
});

const getAccountApprovedTemplate = (name) => ({
    subject: 'Konto zatwierdzone - Cartechstore',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Witaj ${name || ''}!</h2>
      <p>Twoje konto zostało zatwierdzone przez administratora.</p>
      <p>Możesz się teraz zalogować do systemu Cartechstore B2B.</p>
      <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">Zaloguj się</a>
    </div>
  `
});

const getAccountRejectedTemplate = (name, reason) => ({
    subject: 'Konto odrzucone - Cartechstore',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Witaj ${name || ''}!</h2>
      <p>Niestety, Twoje konto zostało odrzucone przez administratora.</p>
      ${reason ? `<p>Powód: ${reason}</p>` : ''}
      <p>Jeśli masz pytania, skontaktuj się z naszym działem obsługi klienta.</p>
    </div>
  `
});

module.exports = {
    sendEmail,
    getVerificationEmailTemplate,
    getPasswordResetTemplate,
    getAccountApprovedTemplate,
    getAccountRejectedTemplate
};
