require('dotenv').config();
const { User } = require('./src/models');

async function listAdmins() {
    try {
        const admins = await User.findAll({
            where: { role: 'admin' },
            attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt']
        });

        console.log('📋 Lista administratorów:');
        if (admins.length === 0) {
            console.log('❌ Brak administratorów w systemie');
            console.log('\n💡 Utwórz administratora używając:');
            console.log('node create-admin.js');
        } else {
            admins.forEach((admin, index) => {
                console.log(`${index + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`);
                console.log(`   ID: ${admin.id}`);
                console.log(`   Utworzono: ${admin.createdAt}`);
                console.log('');
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Błąd:', error);
        process.exit(1);
    }
}

listAdmins();
