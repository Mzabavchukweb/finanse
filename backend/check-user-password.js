require('dotenv').config();
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function checkUserPassword() {
    try {
        console.log('🔍 SPRAWDZANIE HASŁA UŻYTKOWNIKA');
        console.log('================================');

        const user = await User.findOne({
            where: { email: 'zapasyzszafy@gmail.com' }
        });

        if (!user) {
            console.log('❌ Użytkownik nie znaleziony');
            return;
        }

        console.log('✅ Użytkownik znaleziony:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password exists: ${!!user.password}`);

        if (user.password) {
            console.log(`   Password length: ${user.password.length}`);
            console.log(`   Password starts with: ${user.password.substring(0, 10)}...`);
            console.log(`   Is bcrypt hash: ${user.password.startsWith('$2b$') || user.password.startsWith('$2a$')}`);

            // Test hasło z rejestracji - sprawdź jakie hasło było użyte
            const testPasswords = [
                'Realmadrid12!', // PODANE PRZEZ UŻYTKOWNIKA
                'TestPass123!', // Typowe hasło B2B
                'Admin123!@#', // Inne popularne
                'Password123!', // Standard
                'Ania123!', // Na podstawie imienia
                'zapasy123!', // Na podstawie emaila
                'hasło123!', // Polskie
                'test123', // Proste
                'Test123!' // Bez @#
            ];

            console.log('\n🧪 TESTOWANIE RÓŻNYCH HASEŁ:');
            for (const testPassword of testPasswords) {
                try {
                    const isValid = await bcrypt.compare(testPassword, user.password);
                    console.log(`   "${testPassword}": ${isValid ? '✅ PASUJE!' : '❌ nie pasuje'}`);
                    if (isValid) {
                        console.log(`\n🎯 ZNALEZIONE HASŁO: "${testPassword}"`);
                        break;
                    }
                } catch (error) {
                    console.log(`   "${testPassword}": ❌ błąd weryfikacji - ${error.message}`);
                }
            }
        } else {
            console.log('❌ BRAK HASŁA w bazie danych!');
        }

    } catch (error) {
        console.error('Błąd:', error);
    } finally {
        process.exit(0);
    }
}

checkUserPassword();
