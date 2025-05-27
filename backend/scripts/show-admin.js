// Skrypt do podglądu danych admina
const { User } = require('../models');

async function showAdmin() {
    const email = 'zabavchukmaks21@gmail.com';
    const user = await User.findOne({ where: { email } });
    if (!user) {
        console.log('Nie znaleziono użytkownika!');
        process.exit(0);
    }
    console.log('Dane użytkownika:', user.toJSON());
    process.exit(0);
}

showAdmin().catch(err => {
    console.error('Błąd:', err);
    process.exit(1);
});
