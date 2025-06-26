require('dotenv').config();
const { User } = require('./src/models');

async function checkRecentUsers() {
    try {
        console.log('📋 Ostatni użytkownicy w systemie:');

        const users = await User.findAll({
            attributes: [
                'id', 'email', 'firstName', 'lastName', 'status',
                'isEmailVerified', 'createdAt', 'role'
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        if (users.length === 0) {
            console.log('❌ Brak użytkowników w systemie');
            return;
        }

        console.log(`\n✅ Znaleziono ${users.length} użytkowników:\n`);

        users.forEach((user, index) => {
            const date = new Date(user.createdAt).toLocaleString('pl-PL');
            const statusIcon = user.status === 'active' ? '✅' :
                user.status === 'pending_admin_approval' ? '⏳' :
                    user.status === 'pending_email_verification' ? '📧' : '❌';
            const emailIcon = user.isEmailVerified ? '✅' : '❌';
            const roleIcon = user.role === 'admin' ? '👑' : '👤';

            console.log(`${index + 1}. ${roleIcon} ${user.firstName} ${user.lastName}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   ${statusIcon} Status: ${user.status}`);
            console.log(`   ${emailIcon} Email verified: ${user.isEmailVerified ? 'TAK' : 'NIE'}`);
            console.log(`   📅 Rejestracja: ${date}`);
            console.log('');
        });

        // Statystyki
        const activeUsers = users.filter(u => u.status === 'active').length;
        const pendingUsers = users.filter(u => u.status === 'pending_admin_approval').length;
        const pendingEmailUsers = users.filter(u => u.status === 'pending_email_verification').length;
        const verifiedEmails = users.filter(u => u.isEmailVerified).length;

        console.log('📊 STATYSTYKI:');
        console.log(`   Aktywni użytkownicy: ${activeUsers}`);
        console.log(`   Czekają na akceptację: ${pendingUsers}`);
        console.log(`   Czekają na weryfikację email: ${pendingEmailUsers}`);
        console.log(`   Zweryfikowane emaile: ${verifiedEmails}/${users.length}`);

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

checkRecentUsers();
