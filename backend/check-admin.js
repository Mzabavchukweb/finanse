require('dotenv').config();
const { User } = require('./src/models');

async function checkAdmin() {
    try {
        const user = await User.findOne({ where: { email: 'zabavchukmaks21@gmail.com' } });

        if (user) {
            console.log('🔍 Admin user data:', {
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                firstName: user.firstName,
                lastName: user.lastName
            });
        } else {
            console.log('❌ Admin user not found!');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkAdmin();
