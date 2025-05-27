const log = (message, data = {}) => {
    console.log(`[SECURITY] ${message}`, data);
};

const logError = (message, error = {}) => {
    console.error(`[SECURITY ERROR] ${message}`, error);
};

module.exports = {
    log,
    logError
};
