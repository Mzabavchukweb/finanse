const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { PendingUser } = require('../models');
const UserLog = require('../models/UserLog');
const { AppError } = require('../utils/errorHandler');
const { sendEmail } = require('../utils/email');
const { Op } = require('sequelize');

// Konfiguracja JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('BŁĄD: JWT_SECRET nie jest zdefiniowany.');
    process.exit(1);
}

// Konfiguracja email
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Generowanie tokena JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Wysyłanie emaila weryfikacyjnego
const sendVerificationEmail = async (user, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    console.log('Verification URL:', verificationUrl);
    const mailOptions = {
        from: `Cartechstore <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Aktywacja konta - Cartechstore',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <img src="https://cartechstore.pl/logo.png" alt="Cartechstore" style="max-width: 120px; margin-bottom: 1.2rem;">
            <h2 style="color: #2563eb;">Witaj, ${user.firstName}!</h2>
            <p>Dziękujemy za rejestrację w Cartechstore.</p>
            <p>Aby aktywować swoje konto, kliknij w poniższy przycisk:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 16px 38px; background: linear-gradient(90deg, #2563eb 60%, #60a5fa 100%); color: #fff; text-decoration: none; border-radius: 8px; font-size: 1.15rem; font-weight: 700;">Aktywuj konto</a>
            <p style="color: #64748b; font-size: 1rem; margin-top: 1.2rem;">Po weryfikacji emaila Twoje konto musi zostać zatwierdzone przez administratora. Otrzymasz osobny email po akceptacji.</p>
            <p style="color: #64748b; font-size: 1rem;">Jeśli nie rejestrowałeś się w naszym serwisie, zignoruj tę wiadomość.</p>
        </div>
        `
    };

    try {
        await sendEmail(user.email, mailOptions);
        console.log('Email weryfikacyjny wysłany do:', user.email);
    } catch (error) {
        console.error('Błąd podczas wysyłania emaila weryfikacyjnego:', error);
        throw new Error('Nie udało się wysłać emaila weryfikacyjnego');
    }
};

// Rejestracja nowego użytkownika
const register = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            companyName,
            nip,
            phone,
            address
        } = req.body;

        // Sprawdzenie czy użytkownik już istnieje
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { nip }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    error: 'Ten adres email jest już zarejestrowany'
                });
            }
            if (existingUser.nip === nip) {
                return res.status(400).json({
                    error: 'Ten NIP jest już zarejestrowany'
                });
            }
        }

        // Tworzenie użytkownika
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            companyName,
            nip,
            phone,
            address,
            status: 'pending_email_verification'
        });

        // Generowanie tokenu weryfikacyjnego
        const verificationToken = user.generateVerificationToken();
        await user.save();

        // Wysyłanie emaila weryfikacyjnego
        await sendVerificationEmail(user, verificationToken);

        res.status(201).json({
            message: 'Rejestracja przebiegła pomyślnie! Sprawdź swoją skrzynkę email, aby aktywować konto.',
            userId: user.id,
            verificationToken
        });
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        res.status(500).json({
            error: 'Wystąpił błąd podczas rejestracji'
        });
    }
};

// Weryfikacja emaila
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                error: 'Token weryfikacyjny jest wymagany'
            });
        }

        const user = await User.findOne({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Nieprawidłowy lub nieaktualny token weryfikacyjny'
            });
        }

        user.isEmailVerified = true;
        user.status = 'pending_admin_approval';
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        res.status(200).json({
            message: 'Konto zostało pomyślnie zweryfikowane'
        });
    } catch (error) {
        console.error('Błąd podczas weryfikacji:', error);
        res.status(500).json({
            error: 'Wystąpił błąd podczas weryfikacji konta'
        });
    }
};

// Logowanie użytkownika
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email i hasło są wymagane'
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                error: 'Nieprawidłowy email lub hasło'
            });
        }

        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Nieprawidłowy email lub hasło'
            });
        }

        if (!user.isEmailVerified) {
            return res.status(401).json({
                error: 'Konto nie zostało zweryfikowane'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({
                error: 'Konto oczekuje na akceptację przez administratora'
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                companyName: user.companyName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).json({
            error: 'Wystąpił błąd podczas logowania'
        });
    }
};

// Pobieranie profilu użytkownika
const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Błąd podczas pobierania profilu:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas pobierania profilu' });
    }
};

// Sprawdzanie czy firma już istnieje
const checkCompany = async (req, res) => {
    try {
        const { companyName, nip } = req.body;

        if (!companyName || !nip) {
            return res.status(400).json({
                message: 'Nazwa firmy i NIP są wymagane'
            });
        }

        const companyExists = await User.findOne({
            $or: [
                { companyName: { $regex: new RegExp(companyName, 'i') } },
                { nip }
            ]
        });

        res.json({
            exists: !!companyExists,
            message: companyExists ? 'Firma o podanej nazwie lub NIP już istnieje' : 'Firma jest dostępna do rejestracji'
        });
    } catch (error) {
        console.error('Błąd podczas sprawdzania firmy:', error);
        res.status(500).json({
            message: 'Wystąpił błąd podczas sprawdzania firmy',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    verifyEmail,
    checkCompany
};
