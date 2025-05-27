/* eslint-disable max-lines-per-function */
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Lista obsługiwanych krajów z ich kodami NIP/VAT
const SUPPORTED_COUNTRIES = {
    'PL': { name: 'Polska', nipLength: 10, nipRegex: /^\d{10}$/ },
    'DE': { name: 'Niemcy', nipLength: 9, nipRegex: /^\d{9}$/ },
    'CZ': { name: 'Czechy', nipLength: 8, nipRegex: /^\d{8}$/ }
};

// Stałe konfiguracyjne
const MAX_VERIFICATION_ATTEMPTS = 3;
const ACCOUNT_LOCK_DURATION = 30 * 60 * 1000; // 30 minut
const MAX_LOGIN_ATTEMPTS = 5;

module.exports = (sequelize, _Sequelize) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Order, {
                foreignKey: 'userId',
                as: 'orders'
            });
            User.hasOne(models.Cart, {
                foreignKey: 'userId',
                as: 'cart'
            });
        }

        async validatePassword(password) {
            return bcrypt.compare(password, this.password);
        }

        isAccountLocked() {
            return this.accountLockedUntil && Date.now() < this.accountLockedUntil;
        }

        shouldNotifyFailedLogin() {
            return this.failedLoginAttempts >= 3;
        }

        canResendVerification() {
            return this.verificationAttempts < MAX_VERIFICATION_ATTEMPTS;
        }

        isVerificationExpired() {
            return Date.now() > this.emailVerificationExpires;
        }

        async incrementFailedLoginAttempts() {
            this.failedLoginAttempts += 1;
            if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                this.accountLockedUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION);
            }
            await this.save();
        }

        async resetFailedLoginAttempts() {
            this.failedLoginAttempts = 0;
            this.accountLockedUntil = null;
            await this.save();
        }

        generateVerificationToken() {
            const token = crypto.randomBytes(32).toString('hex');
            this.emailVerificationToken = token;
            // 24 godziny
            this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            return token;
        }

        get fullName() {
            return `${this.firstName} ${this.lastName}`;
        }

        get formattedPhone() {
            return this.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
        }
    }

    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        nip: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.JSON,
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user'
        },
        status: {
            type: DataTypes.ENUM(
                'pending_email_verification',
                'pending_admin_approval',
                'active',
                'inactive'
            ),
            defaultValue: 'pending_email_verification'
        },
        isEmailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        emailVerificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        emailVerificationExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        companyCountry: {
            type: DataTypes.STRING,
            allowNull: function () {
                return this.role === 'admin';
            }
        },
        street: {
            type: DataTypes.STRING,
            allowNull: function () {
                return this.role === 'admin';
            }
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: function () {
                return this.role === 'admin';
            },
            validate: {
                validator: function (v) {
                    if (this.role === 'admin') return true;
                    const country = SUPPORTED_COUNTRIES[this.companyCountry];
                    switch (country) {
                        case 'PL':
                            return /^\d{2}-\d{3}$/.test(v);
                        case 'DE':
                            return /^\d{5}$/.test(v);
                        case 'CZ':
                            return /^\d{3}\s?\d{2}$/.test(v);
                        default:
                            return true;
                    }
                },
                message: function (_props) {
                    if (this.role === 'admin') return '';
                    const country = SUPPORTED_COUNTRIES[this.companyCountry];
                    switch (country) {
                        case 'PL':
                            return 'Nieprawidłowy format kodu pocztowego (XX-XXX)';
                        case 'DE':
                            return 'Nieprawidłowy format kodu pocztowego (XXXXX)';
                        case 'CZ':
                            return 'Nieprawidłowy format kodu pocztowego (XXX XX)';
                        default:
                            return 'Nieprawidłowy format kodu pocztowego';
                    }
                }
            }
        },
        city: {
            type: DataTypes.STRING,
            allowNull: function () { return this.role === 'admin'; }
        },
        failedLoginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        accountLockedUntil: {
            type: DataTypes.DATE
        },
        twoFactorSecret: {
            type: DataTypes.STRING,
            allowNull: true
        },
        temp2FASecret: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verificationAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'User',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });

    return User;
}; 
