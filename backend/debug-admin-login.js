require('dotenv').config();
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function debugAdminLogin() {
    try {
        const email = 'zabavchukmaks21@gmail.com';
        const password = 'admin123';

        console.log('🔍 Debugging admin login...');
        console.log('Email:', email);
        console.log('Password:', password);

        // Find user
        const user = await User.findOne({ where: { email } });
        console.log('\n👤 User found:', !!user);

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log('User details:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  Status:', user.status);
        console.log('  Password hash length:', user.password.length);

        // Check role
        console.log('\n🔑 Role check:', user.role === 'admin' ? '✅ PASS' : '❌ FAIL');

        // Test password validation methods
        console.log('\n🔐 Password validation tests:');

        // Method 1: bcrypt.compare (used in admin-login endpoint)
        const method1 = await bcrypt.compare(password, user.password);
        console.log('  bcrypt.compare():', method1 ? '✅ PASS' : '❌ FAIL');

        // Method 2: user.validatePassword (model method)
        const method2 = await user.validatePassword(password);
        console.log('  user.validatePassword():', method2 ? '✅ PASS' : '❌ FAIL');

        console.log('\n📝 Expected admin-login response:');
        if (user.role === 'admin' && method1) {
            console.log('✅ Login should SUCCEED');
        } else {
            console.log('❌ Login should FAIL');
            console.log('  Role check:', user.role === 'admin');
            console.log('  Password check:', method1);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

debugAdminLogin();
