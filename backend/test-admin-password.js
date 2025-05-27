const { User } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
    const email = 'zabavchukmaks21@gmail.com';
    const password = 'admin123';
    const admin = await User.findOne({ where: { email } });
    if (!admin) {
        console.log('Brak admina!');
        process.exit(1);
    }
    console.log('Hash w bazie:', admin.password);
    const isValid = await bcrypt.compare(password, admin.password);
    console.log('Czy hasło admin123 pasuje do rekordu w bazie?', isValid);
    process.exit(0);
})();
