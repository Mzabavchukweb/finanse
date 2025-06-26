const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SecurityLog = sequelize.define('SecurityLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        eventType: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        outcome: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    }, {
        tableName: 'security_logs',
        timestamps: false,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['eventType']
            },
            {
                fields: ['outcome']
            },
            {
                fields: ['ipAddress']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    // Define associations
    SecurityLog.associate = function (models) {
        SecurityLog.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'User'
        });
    };

    return SecurityLog;
};
