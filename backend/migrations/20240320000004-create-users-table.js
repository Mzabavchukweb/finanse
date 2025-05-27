'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true
                }
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            },
            firstName: {
                type: Sequelize.STRING,
                allowNull: false
            },
            lastName: {
                type: Sequelize.STRING,
                allowNull: false
            },
            role: {
                type: Sequelize.ENUM('user', 'admin'),
                defaultValue: 'user'
            },
            isVerified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            verificationToken: {
                type: Sequelize.STRING,
                allowNull: true
            },
            resetPasswordToken: {
                type: Sequelize.STRING,
                allowNull: true
            },
            resetPasswordExpires: {
                type: Sequelize.DATE,
                allowNull: true
            },
            lastLogin: {
                type: Sequelize.DATE,
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

        await queryInterface.addIndex('users', ['email'], {
            unique: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('users');
    }
};
