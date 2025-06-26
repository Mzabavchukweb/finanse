require('dotenv').config();
const { User } = require('./src/models');

async function cleanupPendingUsers() {
    try {
        console.log('🗑️  Usuwanie użytkowników oczekujących na weryfikację emaila...');

        // Delete users with pending_email_verification status
        const deletedCount = await User.destroy({
            where: {
                status: 'pending_email_verification'
            }
        });

        console.log(`✅ Usunięto ${deletedCount} użytkowników oczekujących na weryfikację`);

        // Show remaining users
        const remainingUsers = await User.findAll({
            attributes: ['id', 'email', 'role', 'status', 'isEmailVerified']
        });

        console.log('\n📋 Pozostali użytkownicy:');
        remainingUsers.forEach(user => {
            console.log(`  ${user.role.toUpperCase()}: ${user.email} (status: ${user.status}, verified: ${user.isEmailVerified})`);
        });

        console.log(`\n📊 Łącznie pozostało: ${remainingUsers.length} użytkowników`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

cleanupPendingUsers();
