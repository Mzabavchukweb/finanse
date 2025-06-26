require('dotenv').config();
const { User } = require('./src/models');

async function checkUsers() {
    try {
        const users = await User.findAll({
            attributes: ['id', 'email', 'role', 'status', 'isEmailVerified']
        });

        console.log('📋 Wszyscy użytkownicy w bazie:');
        users.forEach(user => {
            console.log(`  ${user.role.toUpperCase()}: ${user.email} (status: ${user.status}, verified: ${user.isEmailVerified})`);
        });

        console.log(`\n📊 Łącznie: ${users.length} użytkowników`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkUsers();
