require('dotenv').config();
const { User } = require('./src/models');
const { sendEmail } = require('./src/utils/email');

async function testFullRegistration() {
    try {
        console.log('🧪 TESTOWANIE PEŁNEGO PROCESU REJESTRACJI');
        console.log('================================================');

        // Test 1: Rejestracja na email admina (prawdziwy email)
        console.log('\n1. 📧 TEST EMAILA DO ADMINA (prawdziwy):');
        const adminEmailResult = await sendEmail('zabavchukmaks21@gmail.com', {
            subject: '✅ Test rejestracji - email weryfikacyjny',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #10b981; border-radius: 10px;">
                <h2 style="color: #10b981;">✅ Email weryfikacyjny - TEST</h2>
                <p><strong>To jest test prawdziwego emaila dla admina!</strong></p>
                <p>Data: ${new Date().toLocaleString('pl-PL')}</p>
                <p>Proces: Rejestracja → Email weryfikacyjny → Link aktywacyjny</p>
                <a href="http://localhost:3005/api/auth/verify-email?token=TEST123" 
                   style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                   AKTYWUJ KONTO (TEST)
                </a>
            </div>
            `
        });

        console.log('   Wynik:', adminEmailResult.simulated ? '🟡 SYMULOWANY' : '✅ PRAWDZIWY');
        console.log('   Email ID:', adminEmailResult.id);

        // Test 2: Email do zwykłego użytkownika (symulacja)
        console.log('\n2. 📧 TEST EMAILA DO UŻYTKOWNIKA (symulacja):');
        const userEmailResult = await sendEmail('zapasyzszafy@gmail.com', {
            subject: '✅ Test rejestracji - email weryfikacyjny',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #f59e0b; border-radius: 10px;">
                <h2 style="color: #f59e0b;">🟡 Email weryfikacyjny - SYMULACJA</h2>
                <p><strong>To jest test symulowanego emaila!</strong></p>
                <p>Data: ${new Date().toLocaleString('pl-PL')}</p>
                <p>Proces: Rejestracja → Email weryfikacyjny → Auto-weryfikacja</p>
            </div>
            `
        });

        console.log('   Wynik:', userEmailResult.simulated ? '🟡 SYMULOWANY' : '✅ PRAWDZIWY');
        console.log('   Email ID:', userEmailResult.id);

        // Test 3: Email o akceptacji (admin)
        console.log('\n3. 📧 TEST EMAILA O AKCEPTACJI (admin):');
        const approvalAdminResult = await sendEmail('zabavchukmaks21@gmail.com', {
            subject: '🎉 Konto zatwierdzone - Cartechstore',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #10b981; border-radius: 10px;">
                <h2 style="color: #10b981;">🎉 Konto zatwierdzone!</h2>
                <p>Twoje konto zostało zatwierdzone przez administratora.</p>
                <p>Data zatwierdzenia: ${new Date().toLocaleString('pl-PL')}</p>
                <a href="http://localhost:3005/pages/login.html" 
                   style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                   ZALOGUJ SIĘ TERAZ
                </a>
            </div>
            `
        });

        console.log('   Wynik:', approvalAdminResult.simulated ? '🟡 SYMULOWANY' : '✅ PRAWDZIWY');

        // Test 4: Email o akceptacji (użytkownik)
        console.log('\n4. 📧 TEST EMAILA O AKCEPTACJI (użytkownik):');
        const approvalUserResult = await sendEmail('zapasyzszafy@gmail.com', {
            subject: '🎉 Konto zatwierdzone - Cartechstore',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #f59e0b; border-radius: 10px;">
                <h2 style="color: #f59e0b;">🟡 Konto zatwierdzone - SYMULACJA</h2>
                <p>Ten email zostałby wysłany do użytkownika po akceptacji.</p>
                <p>Data: ${new Date().toLocaleString('pl-PL')}</p>
            </div>
            `
        });

        console.log('   Wynik:', approvalUserResult.simulated ? '🟡 SYMULOWANY' : '✅ PRAWDZIWY');

        console.log('\n📊 PODSUMOWANIE TESTÓW:');
        console.log('========================');
        console.log('✅ Admin (zabavchukmaks21@gmail.com): PRAWDZIWE EMAILE');
        console.log('🟡 Użytkownicy (inne adresy): SYMULOWANE EMAILE');
        console.log('');
        console.log('🔍 PRZYCZYNA:');
        console.log('   - Resend API w trybie testowym');
        console.log('   - Może wysyłać tylko na adres właściciela konta');
        console.log('   - Dla innych adresów system robi auto-weryfikację');

    } catch (error) {
        console.error('❌ Błąd testu:', error);
    } finally {
        process.exit(0);
    }
}

testFullRegistration();
