const { Model, DataTypes } = require('sequelize');

class Product extends Model {
    static associate(models) {
        Product.belongsTo(models.Category, {
            foreignKey: 'categoryId',
            as: 'category'
        });
        Product.hasMany(models.OrderItem, {
            foreignKey: 'productId',
            as: 'orderItems'
        });
        Product.hasMany(models.CartItem, {
            foreignKey: 'productId',
            as: 'cartItems'
        });
    }
}

// Product field definitions
const productFields = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    stockQuantity: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.getDataValue('stock');
        },
        set(value) {
            this.setDataValue('stock', value);
        }
    },
    inStock: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.getDataValue('stock') > 0;
        }
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('images');
            if (!rawValue) return [];
            try {
                return JSON.parse(rawValue);
            } catch (e) {
                return [];
            }
        },
        set(value) {
            if (Array.isArray(value)) {
                this.setDataValue('images', JSON.stringify(value));
            } else {
                this.setDataValue('images', '[]');
            }
        }
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: true
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Categories', key: 'id' }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    discountPercentage: {
        type: DataTypes.VIRTUAL,
        get() {
            const originalPrice = this.getDataValue('originalPrice');
            const currentPrice = this.getDataValue('price');

            if (!originalPrice || originalPrice <= currentPrice) {
                return 0;
            }

            return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        }
    },
    formattedPrice: {
        type: DataTypes.VIRTUAL,
        get() {
            const price = this.getDataValue('price');
            return `${price} zł`;
        }
    }
};

// Product indexes configuration
const productIndexes = [
    { fields: ['name'] },
    { fields: ['categoryId'] },
    { fields: ['isActive'] },
    { fields: ['isFeatured'] },
    { fields: ['price'] },
    { fields: ['brand'] },
    { fields: ['isActive', 'categoryId'] },
    { fields: ['isActive', 'isFeatured'] },
    { fields: ['isActive', 'price'] },
    { fields: ['categoryId', 'name'] },
    { fields: ['stock'] },
    { fields: ['isActive', 'createdAt'] }
];

module.exports = function initProductModel(sequelize) {
    Product.init(productFields, {
        sequelize,
        modelName: 'Product',
        timestamps: true,
        indexes: productIndexes
    });

    return Product;
};
