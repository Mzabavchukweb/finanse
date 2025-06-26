require('dotenv').config();
const { User } = require('./src/models');

async function cleanupUsers() {
    try {
        console.log('🗑️  Usuwanie wszystkich użytkowników oprócz admina...');

        // Delete all users except admin
        const deletedCount = await User.destroy({
            where: {
                role: 'user' // Only delete users, keep admins
            }
        });

        console.log(`✅ Usunięto ${deletedCount} użytkowników`);

        // Show remaining users
        const remainingUsers = await User.findAll({
            attributes: ['id', 'email', 'role', 'firstName', 'lastName']
        });

        console.log('\n📋 Pozostali użytkownicy:');
        remainingUsers.forEach(user => {
            console.log(`  ${user.role.toUpperCase()}: ${user.email} (${user.firstName} ${user.lastName})`);
        });

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

cleanupUsers();
