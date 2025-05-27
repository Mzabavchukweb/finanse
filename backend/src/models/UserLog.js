const { Model, DataTypes } = require('sequelize');

class UserLog extends Model {
    static associate(models) {
        UserLog.belongsTo(models.User, { foreignKey: 'userId' });
    }
}

module.exports = (sequelize) => {
    UserLog.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'UserLog',
        timestamps: false
    });

    return UserLog;
};
