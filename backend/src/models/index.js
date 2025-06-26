const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const config = {
    development: {
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    },
    test: {
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    },
    production: {
        dialect: process.env.DB_DIALECT || 'sqlite',
        storage: dbPath,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cartechstore',
        username: process.env.DB_USER || 'cartechstore',
        password: process.env.DB_PASSWORD || '',
        logging: process.env.NODE_ENV === 'production' ? false : console.log,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
};

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize({ ...config[env] });

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.PendingUser = require('./PendingUser')(sequelize, Sequelize);
db.Order = require('./Order')(sequelize, Sequelize);
db.OrderItem = require('./OrderItem')(sequelize, Sequelize);
db.Cart = require('./Cart')(sequelize, Sequelize);
db.CartItem = require('./CartItem')(sequelize, Sequelize);
db.UserLog = require('./UserLog')(sequelize, Sequelize);
db.Product = require('./Product')(sequelize, Sequelize);
db.Category = require('./Category')(sequelize, Sequelize);
db.AdminSession = require('./AdminSession')(sequelize, Sequelize);
db.SecurityLog = require('./SecurityLog')(sequelize, Sequelize);

// Define associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
