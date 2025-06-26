const { User } = require('./backend/src/models');

async function cleanupUnverifiedUsers() {
    try {
        console.log('🗑️ Rozpoczynam czyszczenie niezweryfikowanych użytkowników...');

        // Znajdź wszystkich użytkowników
        const allUsers = await User.findAll();
        console.log(`📊 Znaleziono ${allUsers.length} użytkowników w bazie`);

        // Wyświetl listę użytkowników
        console.log('\n👤 Lista wszystkich użytkowników:');
        allUsers.forEach(user => {
            const status = user.isEmailVerified ? '✅ Zweryfikowany' : '❌ Niezweryfikowany';
            console.log(`  - ${user.email} (${user.role}) - ${status}`);
        });

        // Usuń niezweryfikowanych użytkowników (oprócz adminów)
        const result = await User.destroy({
            where: {
                isEmailVerified: false,
                role: {
                    [require('sequelize').Op.ne]: 'admin'  // Nie usuń adminów
                }
            }
        });

        console.log(`\n🗑️ Usunięto ${result} niezweryfikowanych użytkowników`);

        // Pokaż pozostałych użytkowników
        const remainingUsers = await User.findAll();
        console.log(`\n✅ Pozostało ${remainingUsers.length} użytkowników:`);
        remainingUsers.forEach(user => {
            const status = user.isEmailVerified ? '✅ Zweryfikowany' : '⚠️  Admin (nie wymaga weryfikacji)';
            console.log(`  - ${user.email} (${user.role}) - ${status}`);
        });

        console.log('\n🎉 Czyszczenie zakończone pomyślnie!');
        console.log('💡 W bazie pozostali tylko zweryfikowani użytkownicy i administratorzy.');

    } catch (error) {
        console.error('❌ Błąd podczas czyszczenia:', error);
    } finally {
        process.exit(0);
    }
}

// Uruchom funkcję
cleanupUnverifiedUsers();
