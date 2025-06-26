const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const logger = require('./logger');

// Email provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'gmail'; // 'resend' or 'gmail'
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_eutYnNEV_HaPCfb1Wrcc2YM4Nj1BupEL9';
const ADMIN_EMAIL = 'zabavchukmaks21@gmail.com';

// Initialize providers
const resend = new Resend(RESEND_API_KEY);

const createGmailTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER || 'zabavchukmaks21@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password-here'
        }
    });
};

// Gmail email sender
const sendViaGmail = async (to, { subject, html }) => {
    const transporter = createGmailTransporter();
    
    const mailOptions = {
        from: `"Cartechstore" <${process.env.GMAIL_USER || 'zabavchukmaks21@gmail.com'}>`,
        to: to,
        subject: subject,
        html: html
    };

    const result = await transporter.sendMail(mailOptions);
    return {
        id: result.messageId,
        provider: 'gmail',
        accepted: result.accepted,
        rejected: result.rejected
    };
};

// Resend email sender
const sendViaResend = async (to, { subject, html }) => {
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Cartechstore <onboarding@resend.dev>',
        to: to,
        subject: subject,
        html: html
    });

    if (error) {
        throw new Error(`Resend error: ${error.message}`);
    }

    return {
        id: data.id,
        provider: 'resend'
    };
};

// Main hybrid email function
const sendEmail = async (to, { subject, html }) => {
    try {
        console.log(`📧 Wysyłanie emaila do: ${to} przez ${EMAIL_PROVIDER.toUpperCase()}`);

        let result;

        if (EMAIL_PROVIDER === 'gmail') {
            // Use Gmail SMTP
            result = await sendViaGmail(to, { subject, html });
            logger.info(`Email sent via Gmail: ${result.id}`);
            console.log(`✅ Email wysłany przez Gmail do ${to}: ${result.id}`);
        } else if (EMAIL_PROVIDER === 'resend') {
            // Try Resend first
            try {
                result = await sendViaResend(to, { subject, html });
                logger.info(`Email sent via Resend: ${result.id}`);
                console.log(`✅ Email wysłany przez Resend do ${to}: ${result.id}`);
            } catch (resendError) {
                // If Resend fails (testing mode), fallback to Gmail
                if (resendError.message.includes('testing emails to your own email address')) {
                    console.log(`🔄 Resend testing limit - przełączam na Gmail dla ${to}`);
                    result = await sendViaGmail(to, { subject, html });
                    logger.info(`Email sent via Gmail (Resend fallback): ${result.id}`);
                    console.log(`✅ Email wysłany przez Gmail (fallback) do ${to}: ${result.id}`);
                } else {
                    throw resendError;
                }
            }
        } else {
            throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
        }

        return result;

    } catch (error) {
        logger.error('Hybrid email error:', error);
        console.error('Hybrid email error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Test all email providers
const testEmailProviders = async () => {
    console.log('🧪 TESTOWANIE DOSTAWCÓW EMAIL');
    console.log('==============================');

    // Test Gmail
    try {
        const gmailTransporter = createGmailTransporter();
        await gmailTransporter.verify();
        console.log('✅ Gmail SMTP: Połączenie OK');
    } catch (error) {
        console.log('❌ Gmail SMTP: Błąd połączenia -', error.message);
    }

    // Test Resend
    try {
        const testResult = await resend.emails.send({
            from: 'test@resend.dev',
            to: ADMIN_EMAIL,
            subject: 'Test Resend',
            html: '<p>Test</p>'
        });
        console.log('✅ Resend: Połączenie OK');
    } catch (error) {
        console.log('❌ Resend: Błąd połączenia -', error.message);
    }
};

module.exports = {
    sendEmail,
    testEmailProviders,
    sendViaGmail,
    sendViaResend
}; 