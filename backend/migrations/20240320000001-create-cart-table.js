'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Carts', {
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
            type: {
                type: Sequelize.ENUM('inquiry', 'order'),
                defaultValue: 'inquiry'
            },
            status: {
                type: Sequelize.ENUM('draft', 'submitted', 'responded', 'accepted', 'rejected'),
                defaultValue: 'draft'
            },
            userMessage: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            adminResponse: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            adminPrice: {
                type: Sequelize.DECIMAL(10, 2),
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
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Carts');
    }
};
