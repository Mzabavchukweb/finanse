const { Model, DataTypes } = require('sequelize');

class Order extends Model {
    static associate(models) {
        Order.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Order.hasMany(models.OrderItem, {
            foreignKey: 'orderId',
            as: 'items'
        });
    }
}

module.exports = (sequelize) => {
    Order.init({
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
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'PLN'
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
            defaultValue: 'pending',
            allowNull: false
        },
        paymentStatus: {
            type: DataTypes.ENUM('pending', 'paid', 'failed'),
            defaultValue: 'pending',
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false
        },
        paymentIntentId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shippingAddress: {
            type: DataTypes.JSON,
            allowNull: false
        },
        billingAddress: {
            type: DataTypes.JSON,
            allowNull: false
        },
        shippingMethod: {
            type: DataTypes.STRING,
            allowNull: false
        },
        shippingCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        trackingNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        estimatedDeliveryDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        actualDeliveryDate: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Order',
        timestamps: true
    });

    return Order;
};
