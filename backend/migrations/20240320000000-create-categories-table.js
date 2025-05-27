'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('categories', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            slug: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            parentId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'categories',
                    key: 'id'
                }
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            imageUrl: {
                type: Sequelize.STRING,
                allowNull: true
            },
            metaTitle: {
                type: Sequelize.STRING,
                allowNull: true
            },
            metaDescription: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            displayOrder: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            path: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
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

        await queryInterface.addIndex('categories', ['slug'], {
            unique: true
        });

        await queryInterface.addIndex('categories', ['isActive']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('categories');
    }
};
