const { User } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
    const email = 'zabavchukmaks21@gmail.com';
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    const [count] = await User.update(
        { password: hash, isVerified: true, status: 'active', failedLoginAttempts: 0, accountLockedUntil: null },
        { where: { email } }
    );
    if (!count) {
        console.log('Brak admina!');
        process.exit(1);
    }
    console.log('Hasło admina zresetowane (User.update)!');
    process.exit(0);
})();
