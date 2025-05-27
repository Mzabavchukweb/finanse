const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { validationResult } = require('express-validator');
const UserLog = require('../models/UserLog');
const PendingUser = require('../models/PendingUser');

// Konfiguracja transporter dla nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generowanie tokena JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Weryfikacja NIP w bazie REGON
const verifyNip = async (nip) => {
    try {
        const response = await axios.get(`https://api.regon.gov.pl/api/checknip/${nip}`, {
            headers: {
                'Authorization': `Bearer ${process.env.REGON_API_KEY}`
            }
        });

        if (!response.data.isValid) {
            return {
                isValid: false,
                error: 'Nieprawidłowy NIP'
            };
        }

        return {
            isValid: true,
            data: response.data
        };
    } catch (error) {
        console.error('Błąd weryfikacji NIP:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            return {
                isValid: false,
                error: 'Błąd autoryzacji API REGON'
            };
        }

        if (error.response?.status === 404) {
            return {
                isValid: false,
                error: 'NIP nie został znaleziony w bazie REGON'
            };
        }

        return {
            isValid: false,
            error: 'Błąd podczas weryfikacji NIP. Spróbuj ponownie później.'
        };
    }
};

// Rejestracja użytkownika
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, companyName, nip, phone, address } = req.body;
        console.log('Akcja: rejestracja', { email });

        // Sprawdzenie czy użytkownik już istnieje
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Użytkownik o podanym adresie email już istnieje' });
        }

        // Sprawdzenie czy firma już istnieje
        user = await User.findOne({ companyName, nip });
        if (user) {
            return res.status(400).json({ message: 'Firma o podanej nazwie i NIP już istnieje' });
        }

        // Weryfikacja NIP w bazie REGON
        const nipVerification = await verifyNip(nip);
        if (!nipVerification.isValid) {
            return res.status(400).json({ message: nipVerification.error });
        }

        // Tworzenie nowego użytkownika
        user = new User({
            email,
            password,
            firstName,
            lastName,
            companyName,
            nip,
            phone,
            address,
            isEmailVerified: false
        });

        // Generowanie tokena weryfikacyjnego
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 godziny

        await user.save();

        // Wysłanie maila weryfikacyjnego do użytkownika
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Weryfikacja adresu email',
            html: `
                <h1>Witaj ${firstName}!</h1>
                <p>Dziękujemy za rejestrację w naszym serwisie.</p>
                <p>Aby aktywować swoje konto, kliknij w poniższy link:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
                <p>Link jest ważny przez 24 godziny.</p>
            `
        });

        // Wysłanie maila do admina o nowym użytkowniku
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: 'Nowy użytkownik zarejestrowany',
            html: `
                <h1>Nowy użytkownik zarejestrowany</h1>
                <p>Użytkownik: ${firstName} ${lastName}</p>
                <p>Email: ${email}</p>
                <p>Firma: ${companyName}</p>
                <p>NIP: ${nip}</p>
                <p>Telefon: ${phone}</p>
                <p>Adres: ${address.street}, ${address.postalCode} ${address.city}</p>
            `
        });

        res.status(201).json({
            success: true,
            message: 'Rejestracja zakończona sukcesem. Sprawdź swój email w celu weryfikacji konta.'
        });
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas rejestracji' });
    }
};

// Weryfikacja emaila
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            email: decoded.email,
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Nieprawidłowy lub wygasły token weryfikacyjny' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.status = 'pending_admin_approval';
        await user.save();

        res.json({ message: 'Email został zweryfikowany pomyślnie' });
    } catch (error) {
        console.error('Błąd weryfikacji emaila:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas weryfikacji emaila' });
    }
};

// Logowanie
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Akcja: logowanie', { email });

        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log('Brak użytkownika');
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Złe hasło');
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
        }

        if (!user.isEmailVerified) {
            console.log('Email niezweryfikowany');
            return res.status(401).json({ message: 'Proszę zweryfikować swój adres email (sprawdź skrzynkę pocztową)' });
        }
        if (user.status !== 'active') {
            console.log('Status konta:', user.status);
            return res.status(401).json({ message: 'Konto oczekuje na zatwierdzenie przez administratora. Zwykle trwa to do godziny.' });
        }

        console.log('Logowanie OK:', user.email, user.role);
        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user.id || user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                companyName: user.companyName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas logowania' });
    }
};

// Pobieranie listy użytkowników (dla admina)
exports.getUsers = async (req, res) => {
    try {
        const { status } = req.query;
        const where = status ? { status } : {};
        const users = await User.findAll({ where, attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Usuwanie użytkownika (dla admina)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        await user.destroy();
        res.json({ message: 'Użytkownik usunięty' });
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Ponowne wysłanie maila weryfikacyjnego
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email został już zweryfikowany' });
        }

        // Generowanie nowego tokena weryfikacyjnego
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 godziny
        await user.save();

        // Wysłanie maila weryfikacyjnego
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Weryfikacja adresu email',
            html: `
                <h1>Witaj ${user.firstName}!</h1>
                <p>Otrzymaliśmy prośbę o ponowne wysłanie linku weryfikacyjnego.</p>
                <p>Aby aktywować swoje konto, kliknij w poniższy link:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
                <p>Link jest ważny przez 24 godziny.</p>
            `
        });

        res.json({ message: 'Email weryfikacyjny został wysłany ponownie' });
    } catch (error) {
        console.error('Błąd ponownego wysłania maila weryfikacyjnego:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas wysyłania maila weryfikacyjnego' });
    }
};

// Aktualizuję funkcję acceptPendingUser, która jest jedyną prawidłową implementacją
exports.acceptPendingUser = async (req, res) => {
    console.log('acceptPendingUser wywołany! ID:', req.params.id);
    try {
        const pendingUser = await PendingUser.findByPk(req.params.id);
        if (!pendingUser) {
            console.log('Nie znaleziono PendingUser o ID:', req.params.id);
            return res.status(404).json({ message: 'Nie znaleziono zgłoszenia' });
        }

        // Sprawdź, czy nie istnieje już taki użytkownik
        const existingUser = await User.findOne({ where: { email: pendingUser.email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Użytkownik już istnieje' });
        }

        // Utwórz użytkownika
        const newUser = await User.create({
            email: pendingUser.email,
            password: pendingUser.password, // Hasło jest już zahashowane
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            companyName: pendingUser.companyName,
            nip: pendingUser.nip,
            phone: pendingUser.phone,
            address: pendingUser.address,
            isEmailVerified: true,
            status: 'active',
            role: 'user'
        });

        // Usuń zgłoszenie
        await pendingUser.destroy();

        // Wyślij mail o akceptacji
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: newUser.email,
            subject: 'Twoje konto zostało zatwierdzone',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; padding: 0; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #22c55e 60%, #16a34a 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                        <img src="https://cartechstore.pl/logo.png" alt="Cartechstore" style="max-width: 120px; margin-bottom: 1.2rem;">
                        <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Witaj, ${newUser.firstName}!</h1>
                        <p style="color: #e0e7ef; font-size: 1.1rem; margin: 0;">Twoje konto zostało zatwierdzone.</p>
                    </div>
                    <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                        <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">Możesz się teraz zalogować do swojego konta:</p>
                        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: #22c55e; color: #fff; padding: 0.8rem 1.5rem; text-decoration: none; border-radius: 8px; font-weight: 500; margin-bottom: 2rem;">Zaloguj się</a>
                        <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 2.2rem;">W razie pytań skontaktuj się z nami: <a href="mailto:support@cartechstore.pl" style="color: #2563eb; text-decoration: underline;">support@cartechstore.pl</a></p>
                    </div>
                    <div style="background: #f1f5f9; padding: 1.2rem 2rem; text-align: center; color: #64748b; font-size: 0.98rem; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cartechstore. Wszelkie prawa zastrzeżone.</p>
                    </div>
                </div>
            `
        });

        // Logowanie akcji
        await UserLog.create({
            userId: newUser.id,
            action: 'user_approved',
            details: `Użytkownik zatwierdzony przez admina (ID: ${req.user.id})`
        });

        res.json({ message: 'Użytkownik został zatwierdzony' });
    } catch (error) {
        console.error('Błąd zatwierdzania użytkownika:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas zatwierdzania użytkownika' });
    }
};

// Odrzuć zgłoszenie rejestracyjne
exports.rejectPendingUser = async (req, res) => {
    try {
        const pendingUser = await PendingUser.findByPk(req.params.id);
        if (!pendingUser) return res.status(404).json({ message: 'Nie znaleziono zgłoszenia' });
        pendingUser.status = 'rejected';
        await pendingUser.save();
        // Wyślij mail o odrzuceniu
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: pendingUser.email,
            subject: 'Twoje zgłoszenie zostało odrzucone',
            html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; padding: 0; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #ef4444 60%, #f59e0b 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                <img src="https://cartechstore.pl/logo.png" alt="Cartechstore" style="max-width: 120px; margin-bottom: 1.2rem;">
                <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Witaj, ${pendingUser.firstName}!</h1>
                <p style="color: #e0e7ef; font-size: 1.1rem; margin: 0;">Twoje zgłoszenie zostało odrzucone przez administratora.</p>
              </div>
              <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 2.2rem;">W razie pytań skontaktuj się z nami: <a href="mailto:support@cartechstore.pl" style="color: #2563eb; text-decoration: underline;">support@cartechstore.pl</a></p>
              </div>
              <div style="background: #f1f5f9; padding: 1.2rem 2rem; text-align: center; color: #64748b; font-size: 0.98rem; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cartechstore. Wszelkie prawa zastrzeżone.</p>
              </div>
            </div>`
        });
        res.json({ message: 'Zgłoszenie odrzucone' });
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Historia/logi użytkownika
exports.getUserLogs = async (req, res) => {
    try {
        const logs = await UserLog.findAll({ where: { userId: req.params.id }, order: [['createdAt', 'DESC']], limit: 50 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Pobierz wszystkie zgłoszenia rejestracyjne (tylko admin)
exports.getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await PendingUser.findAll({ order: [['createdAt', 'DESC']] });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Zmiana hasła (reset)
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        // ... existing code ...
        console.log('Akcja: zmiana hasła', { userId: user.id, email: user.email });
        // ... existing code ...
    } catch (error) {
        // ... existing code ...
    }
};
