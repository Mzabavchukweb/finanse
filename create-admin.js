const bcrypt = require('bcryptjs');
const { User } = require('./backend/src/models');

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'CarTechStore',
            email: 'admin@cartechstore.pl',
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            isEmailVerified: true,
            companyName: 'CarTechStore Admin',
            companyCountry: 'PL'
        });

        console.log('✅ ADMIN CREATED:', admin.email);
        console.log('📧 Email: admin@cartechstore.pl');
        console.log('🔐 Password: Admin123!@#');

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('⚠️ Admin already exists - admin@cartechstore.pl');
        } else {
            console.error('❌ ERROR:', error.message);
        }
    }

    process.exit(0);
}

createAdmin();
