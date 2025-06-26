const nodemailer = require('nodemailer');
const logger = require('./logger');

// Gmail SMTP Configuration (FREE!)
const createGmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER || 'zabavchukmaks21@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password-here' // App Password, nie zwykłe hasło!
        }
    });
};

// Main email sending function (FREE Gmail SMTP)
const sendEmailGmail = async (to, { subject, html }) => {
    try {
        console.log('🔧 Creating Gmail transporter...');
        const transporter = createGmailTransporter();

        // Verify connection
        console.log('🔗 Testing Gmail SMTP connection...');
        await transporter.verify();
        console.log('✅ Gmail SMTP połączenie działa!');

        const mailOptions = {
            from: `"Cartechstore" <${process.env.GMAIL_USER || 'zabavchukmaks21@gmail.com'}>`,
            to: to,
            subject: subject,
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email Gmail wysłany pomyślnie do ${to}: ${result.messageId}`);
        
        return {
            id: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected,
            provider: 'gmail-smtp'
        };

    } catch (error) {
        console.error('Gmail SMTP error:', error);
        throw new Error(`Failed to send email via Gmail: ${error.message}`);
    }
};

// Test Gmail connection
const testGmailConnection = async () => {
    try {
        console.log('🧪 Testing Gmail SMTP connection...');
        console.log('📧 Gmail User:', process.env.GMAIL_USER || 'zabavchukmaks21@gmail.com');
        console.log('🔑 Gmail App Password set:', process.env.GMAIL_APP_PASSWORD ? 'YES' : 'NO');
        
        const transporter = createGmailTransporter();
        await transporter.verify();
        console.log('✅ Gmail SMTP connection successful!');
        return true;
    } catch (error) {
        console.error('❌ Gmail SMTP connection failed:', error.message);
        return false;
    }
};

module.exports = {
    sendEmailGmail,
    testGmailConnection
}; 