const db = require('./backend/src/models');
const { User } = db;

async function cleanupUsers() {
    try {
        console.log('🗑️ Rozpoczynam czyszczenie bazy użytkowników...');

        // Synchronizuj bazę, jeśli tabela nie istnieje
        await db.sequelize.sync();

        // Znajdź wszystkich użytkowników
        const allUsers = await User.findAll();
        console.log(`📊 Znaleziono ${allUsers.length} użytkowników w bazie`);

        // Wyświetl listę użytkowników
        console.log('\n👤 Lista użytkowników:');
        allUsers.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ID: ${user.id}`);
        });

        // Usuń wszystkich oprócz adminów
        const result = await User.destroy({
            where: {
                role: {
                    [require('sequelize').Op.ne]: 'admin'  // Nie równy 'admin'
                }
            }
        });

        console.log(`\n🗑️ Usunięto ${result} użytkowników (nieadminów)`);

        // Pokaż pozostałych użytkowników
        const remainingUsers = await User.findAll();
        console.log(`\n✅ Pozostało ${remainingUsers.length} użytkowników:`);
        remainingUsers.forEach(user => {
            console.log(`  - ${user.email} (${user.role})`);
        });

        console.log('\n🎉 Czyszczenie zakończone pomyślnie!');

    } catch (error) {
        console.error('❌ Błąd podczas czyszczenia:', error);
    } finally {
        process.exit(0);
    }
}

// Uruchom funkcję
cleanupUsers();
