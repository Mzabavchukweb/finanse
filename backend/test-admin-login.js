require('dotenv').config();
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
    try {
        const admin = await User.findOne({
            where: {
                email: 'zabavchukmaks21@gmail.com',
                role: 'admin'
            }
        });

        if (!admin) {
            console.log('❌ Admin not found');
            return;
        }

        console.log('✅ Admin found:');
        console.log('  Email:', admin.email);
        console.log('  Role:', admin.role);
        console.log('  Status:', admin.status);
        console.log('  Email verified:', admin.isEmailVerified);

        // Test password
        const testPassword = 'admin123';
        console.log('\n🔐 Testing password:', testPassword);

        const isValid = await bcrypt.compare(testPassword, admin.password);
        console.log('  Password valid:', isValid);

        if (!isValid) {
            console.log('\n🔧 Creating new admin with correct password...');

            // Delete old admin and create new one
            await admin.destroy();

            const newPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = await User.create({
                email: 'zabavchukmaks21@gmail.com',
                password: newPassword,
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
            console.log('  Email: zabavchukmaks21@gmail.com');
            console.log('  Password: admin123');

            // Test new password
            const isNewValid = await bcrypt.compare('admin123', newAdmin.password);
            console.log('  New password valid:', isNewValid);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

testAdminLogin();
