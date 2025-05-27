'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Create Inquiries table
        await queryInterface.createTable('Inquiries', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            status: {
                type: Sequelize.ENUM('pending', 'responded', 'accepted', 'rejected'),
                defaultValue: 'pending',
                allowNull: false
            },
            adminResponse: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            adminPrice: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            userMessage: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // Create InquiryItems table
        await queryInterface.createTable('InquiryItems', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            inquiryId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Inquiries',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            productId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 1
                }
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // Add indexes
        await queryInterface.addIndex('Inquiries', ['userId']);
        await queryInterface.addIndex('Inquiries', ['status']);
        await queryInterface.addIndex('InquiryItems', ['inquiryId']);
        await queryInterface.addIndex('InquiryItems', ['productId']);
        await queryInterface.addIndex('InquiryItems', ['inquiryId', 'productId'], {
            unique: true,
            name: 'inquiry_items_unique'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('InquiryItems');
        await queryInterface.dropTable('Inquiries');
    }
};
