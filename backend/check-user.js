require('dotenv').config();
const { User } = require('./src/models');

async function checkUser() {
    try {
        const email = 'zapasyzszafy@gmail.com';
        console.log(`🔍 Sprawdzanie użytkownika: ${email}`);

        const user = await User.findOne({
            where: { email },
            attributes: [
                'id', 'email', 'firstName', 'lastName', 'status',
                'isEmailVerified', 'emailVerificationToken',
                'emailVerificationExpires', 'createdAt'
            ]
        });

        if (user) {
            console.log('✅ Użytkownik znaleziony:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Imię: ${user.firstName} ${user.lastName}`);
            console.log(`   Status: ${user.status}`);
            console.log(`   Email zweryfikowany: ${user.isEmailVerified ? 'TAK' : 'NIE'}`);
            console.log(`   Token weryfikacyjny: ${user.emailVerificationToken ? 'ISTNIEJE' : 'BRAK'}`);
            console.log(`   Token wygasa: ${user.emailVerificationExpires ? new Date(user.emailVerificationExpires).toLocaleString('pl-PL') : 'BRAK'}`);
            console.log(`   Data rejestracji: ${new Date(user.createdAt).toLocaleString('pl-PL')}`);
        } else {
            console.log('❌ Użytkownik nie został znaleziony w bazie danych');
        }

        // Sprawdź też wszystkich użytkowników z podobnym emailem
        console.log('\n📋 Wszyscy użytkownicy zawierający "zapasy":');
        const similarUsers = await User.findAll({
            where: {
                email: {
                    [require('sequelize').Op.like]: '%zapasy%'
                }
            },
            attributes: ['id', 'email', 'status', 'isEmailVerified', 'createdAt']
        });

        if (similarUsers.length > 0) {
            similarUsers.forEach(u => {
                console.log(`   ${u.email} - Status: ${u.status}, Verified: ${u.isEmailVerified}`);
            });
        } else {
            console.log('   Brak użytkowników z "zapasy" w emailu');
        }

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

checkUser();
