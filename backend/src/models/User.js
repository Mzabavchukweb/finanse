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

// Regex dla walidacji hasła
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
            if (!this.phone) return null;
            return this.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
        }

        validateNipForCountry() {
            if (!this.nip || !this.companyCountry) return true;
            
            const countryConfig = SUPPORTED_COUNTRIES[this.companyCountry];
            if (!countryConfig) return false;
            
            return countryConfig.nipRegex.test(this.nip);
        }

        // Static method for password validation
        static validatePasswordStrength(password) {
            return PASSWORD_REGEX.test(password);
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
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Imię jest wymagane' },
                len: {
                    args: [2, 50],
                    msg: 'Imię musi mieć od 2 do 50 znaków'
                }
            }
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Nazwisko jest wymagane' },
                len: {
                    args: [2, 50],
                    msg: 'Nazwisko musi mieć od 2 do 50 znaków'
                }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                name: 'users_email_unique',
                msg: 'Ten adres email jest już używany'
            },
            validate: {
                isEmail: { msg: 'Nieprawidłowy format email' },
                notEmpty: { msg: 'Email jest wymagany' }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Hasło jest wymagane' }
            }
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: {
                    args: [0, 100],
                    msg: 'Nazwa firmy może mieć maksymalnie 100 znaków'
                }
            }
        },
        nip: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: false,
            validate: {
                isValidNip(value) {
                    if (value && this.companyCountry) {
                        const countryConfig = SUPPORTED_COUNTRIES[this.companyCountry];
                        if (!countryConfig || !countryConfig.nipRegex.test(value)) {
                            throw new Error(`Nieprawidłowy format NIP dla kraju ${this.companyCountry}`);
                        }
                    }
                }
            }
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isValidPhone(value) {
                    if (value && !/^\+?[0-9\s-]{9,15}$/.test(value)) {
                        throw new Error('Nieprawidłowy format telefonu');
                    }
                }
            }
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
        isVerified: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.isEmailVerified;
            },
            set(value) {
                this.setDataValue('isEmailVerified', value);
            }
        },
        emailVerificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        emailVerificationExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        resetPasswordExpires: {
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
            },
            defaultValue: 'PL',
            validate: {
                isIn: {
                    args: [Object.keys(SUPPORTED_COUNTRIES)],
                    msg: 'Nieobsługiwany kraj'
                }
            }
        },
        street: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: {
                    args: [0, 100],
                    msg: 'Ulica może mieć maksymalnie 100 znaków'
                }
            }
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isValidPostalCode(value) {
                    if (value && this.companyCountry) {
                        const patterns = {
                            'PL': /^\d{2}-\d{3}$/,
                            'DE': /^\d{5}$/,
                            'CZ': /^\d{3}\s?\d{2}$/
                        };
                        
                        const pattern = patterns[this.companyCountry];
                        if (pattern && !pattern.test(value)) {
                            const formats = {
                                'PL': 'XX-XXX',
                                'DE': 'XXXXX',
                                'CZ': 'XXX XX'
                            };
                            const msg = `Nieprawidłowy format kodu pocztowego dla ` +
                                `${this.companyCountry} (format: ${formats[this.companyCountry]})`;
                            throw new Error(msg);
                        }
                    }
                }
            }
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: {
                    args: [0, 50],
                    msg: 'Miasto może mieć maksymalnie 50 znaków'
                }
            }
        },
        failedLoginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        accountLockedUntil: {
            type: DataTypes.DATE,
            allowNull: true
        },
        twoFactorSecret: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tempTwoFactorSecret: {
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
        indexes: [
            {
                fields: ['email']
            },
            {
                fields: ['status']
            },
            {
                fields: ['role']
            },
            {
                fields: ['isEmailVerified']
            },
            {
                fields: ['lastLogin']
            },
            {
                fields: ['status', 'role']
            },
            {
                fields: ['isEmailVerified', 'status']
            },
            {
                fields: ['accountLockedUntil']
            },
            {
                fields: ['emailVerificationToken']
            },
            {
                fields: ['status', 'createdAt']
            }
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    // Validate password strength before hashing
                    if (!User.validatePasswordStrength(user.password)) {
                        const msg = 'Hasło musi zawierać co najmniej 8 znaków, ' +
                            'wielką literę, małą literę, cyfrę i znak specjalny';
                        throw new Error(msg);
                    }
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    // Validate password strength before hashing
                    if (!User.validatePasswordStrength(user.password)) {
                        const msg = 'Hasło musi zawierać co najmniej 8 znaków, ' +
                            'wielką literę, małą literę, cyfrę i znak specjalny';
                        throw new Error(msg);
                    }
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
            beforeValidate: async (user) => {
                // Normalize email to lowercase
                if (user.email) {
                    user.email = user.email.toLowerCase().trim();
                }
                
                // Normalize phone number
                if (user.phone) {
                    user.phone = user.phone.replace(/\s+/g, '').trim();
                }
                
                // Validate NIP for country
                if (user.nip && user.companyCountry && !user.validateNipForCountry()) {
                    const msg = `Nieprawidłowy format NIP dla kraju ${user.companyCountry}`;
                    throw new Error(msg);
                }
            }
        },
        validate: {
            nipRequiredForCompany() {
                if (this.companyName && !this.nip && this.role === 'user') {
                    throw new Error('NIP jest wymagany dla kont firmowych');
                }
            }
        },
        tableName: 'users'
    });

    return User;
};
