const { Model, DataTypes } = require('sequelize');

class Cart extends Model {
    static associate(models) {
        Cart.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Cart.hasMany(models.CartItem, {
            foreignKey: 'cartId',
            as: 'items'
        });
    }
}

module.exports = (sequelize) => {
    Cart.init({
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
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 }
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'PLN',
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'converted', 'abandoned'),
            defaultValue: 'active',
            allowNull: false
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Cart',
        timestamps: true
    });

    return Cart;
};
