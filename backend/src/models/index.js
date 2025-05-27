const { Sequelize } = require('sequelize');

const config = {
    development: {
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: false
    },
    test: {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    },
    production: {
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: false
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

// Define associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
