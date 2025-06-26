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
            allowNull: false,
            validate: {
                min: 0
            }
        },
        orderNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'PLN'
        },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
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
        },
        formattedCreatedAt: {
            type: DataTypes.VIRTUAL,
            get() {
                const date = this.getDataValue('createdAt');
                if (!date) return '';
                return new Date(date).toLocaleDateString('en-GB');
            }
        }
    }, {
        sequelize,
        modelName: 'Order',
        timestamps: true,
        indexes: [
            // Index for user's orders lookup
            {
                fields: ['userId']
            },
            // Index for order status filtering
            {
                fields: ['status']
            },
            // Index for payment status filtering
            {
                fields: ['paymentStatus']
            },
            // Index for order number lookup
            {
                fields: ['orderNumber']
            },
            // Index for date-based queries
            {
                fields: ['createdAt']
            },
            // Composite index for user's orders by status
            {
                fields: ['userId', 'status']
            },
            // Composite index for admin order management
            {
                fields: ['status', 'paymentStatus']
            },
            // Composite index for user's recent orders
            {
                fields: ['userId', 'createdAt']
            },
            // Composite index for payment processing
            {
                fields: ['paymentStatus', 'createdAt']
            },
            // Index for analytics and reporting
            {
                fields: ['totalAmount']
            },
            // Composite index for order fulfillment
            {
                fields: ['status', 'createdAt']
            }
        ],
        hooks: {
            beforeCreate: async (order) => {
                if (!order.orderNumber) {
                    const timestamp = Date.now().toString().slice(-6);
                    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
                    order.orderNumber = `ORD-${timestamp}-${random}`;
                }
            }
        }
    });

    // Instance methods
    Order.prototype.canTransitionTo = function (newStatus) {
        const transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'shipped', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered'],
            'delivered': [],
            'cancelled': []
        };

        return transitions[this.status]?.includes(newStatus) || false;
    };

    Order.prototype.updateStatus = async function (newStatus) {
        if (!this.canTransitionTo(newStatus)) {
            throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
        }

        this.status = newStatus;
        await this.save();
        return this;
    };

    Order.prototype.calculateTotal = async function () {
        const { OrderItem } = require('./index');
        const items = await OrderItem.findAll({
            where: { orderId: this.id }
        });

        const total = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        return total;
    };

    return Order;
};
