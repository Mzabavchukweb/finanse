require('dotenv').config();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.sqlite');

module.exports = {
    // Konfiguracja bazy danych
    db: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auto-parts-b2b'
    },

    // Konfiguracja JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '24h'
    },

    // Konfiguracja email
    email: {
        resendApiKey: process.env.RESEND_API_KEY,
        fromEmail: 'onboarding@resend.dev'
    },

    // Konfiguracja frontendu
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3005'
    },

    // Konfiguracja API REGON
    regon: {
        apiKey: process.env.REGON_API_KEY,
        baseUrl: 'https://api.regon.gov.pl/api'
    },

    development: {
        dialect: 'sqlite',
        storage: dbPath,
        logging: console.log
    },
    test: {
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    },
    production: {
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    }
};
