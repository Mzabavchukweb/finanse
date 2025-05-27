const logger = require('./logger');

const sendVerificationEmail = async (email, token) => {
    logger.info(`Sending verification email to ${email} with token ${token}`);
    return true;
};

const sendPasswordResetEmail = async (email, token) => {
    logger.info(`Sending password reset email to ${email} with token ${token}`);
    return true;
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
