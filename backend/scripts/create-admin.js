// Skrypt do utworzenia konta admina z kompletem danych
const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const email = 'zabavchukmaks21@gmail.com';
    const password = 'Realmadrid12!';
    const firstName = 'Maksym';
    const lastName = 'Zabavchuk';
    const companyName = 'CarTech Admin';
    const nip = '9999999999';
    const phone = '+48123456789';
    const companyCountry = 'PL';
    const street = 'Adminowa 1';
    const postalCode = '00-001';
    const city = 'Warszawa';

    // Usuń starego admina jeśli istnieje
    await User.destroy({ where: { email } });

    // NIE haszuj hasła tutaj!
    const user = await User.create({
        email,
        password, // czysty tekst!
        firstName,
        lastName,
        companyName,
        nip,
        phone,
        role: 'admin',
        isEmailVerified: true,
        isVerified: true,
        status: 'active',
        companyCountry,
        street,
        postalCode,
        city
    });
    console.log('Admin utworzony:', user.email);
    process.exit(0);
}

createAdmin().catch(err => {
    console.error('Błąd:', err);
    process.exit(1);
});
