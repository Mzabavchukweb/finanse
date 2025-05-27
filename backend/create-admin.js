const { User } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        const password = await bcrypt.hash('admin123', 10);
        const [admin, created] = await User.findOrCreate({
            where: { email: 'zabavchukmaks21@gmail.com' },
            defaults: {
                password,
                firstName: 'Maksym',
                lastName: 'Zabavchuk',
                companyName: 'CarTech Admin',
                nip: '9999999999',
                phone: '+48123456789',
                role: 'admin',
                isVerified: true,
                isEmailVerified: true,
                status: 'active',
                companyCountry: 'PL',
                street: 'Adminowa 1',
                postalCode: '00-001',
                city: 'Warszawa'
            }
        });

        if (created) {
            console.log('Admin user created successfully!');
            console.log('Email:', admin.email);
            console.log('Password: admin123');
        } else {
            console.log('Admin user already exists.');
            console.log('Email:', admin.email);
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        process.exit(0);
    }
})();
