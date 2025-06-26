require('dotenv').config();
const { User } = require('./src/models');

async function fixAdminPassword() {
    try {
        // Delete existing admin
        await User.destroy({
            where: {
                email: 'zabavchukmaks21@gmail.com',
                role: 'admin'
            }
        });
        console.log('🗑️  Deleted existing admin');

        // Create new admin with raw password (model hook will hash it)
        const admin = await User.create({
            email: 'zabavchukmaks21@gmail.com',
            password: 'admin123', // Raw password - will be hashed by model hook
            firstName: 'Maksym',
            lastName: 'Zabavchuk',
            companyName: 'CarTech Admin',
            nip: '9999999999',
            phone: '+48123456789',
            role: 'admin',
            isEmailVerified: true,
            status: 'active',
            companyCountry: 'PL',
            street: 'Adminowa 1',
            postalCode: '00-001',
            city: 'Warszawa'
        });

        console.log('✅ New admin created successfully!');
        console.log('  Email:', admin.email);
        console.log('  Password: admin123');

        // Test password validation
        const isValid = await admin.validatePassword('admin123');
        console.log('  Password validation test:', isValid ? '✅ PASSED' : '❌ FAILED');

        if (isValid) {
            console.log('\n🎉 Admin login should now work!');
            console.log('Try logging in with:');
            console.log('  Email: zabavchukmaks21@gmail.com');
            console.log('  Password: admin123');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

fixAdminPassword();
