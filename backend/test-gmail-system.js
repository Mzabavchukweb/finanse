require('dotenv').config();
const { sendEmailGmail, testGmailConnection } = require('./src/utils/email-gmail');

async function testGmailSystem() {
    try {
        console.log('🆓 TESTOWANIE DARMOWEGO SYSTEMU EMAIL - GMAIL SMTP');
        console.log('================================================');

        // Test 1: Connection test
        console.log('\n1. 🔗 TEST POŁĄCZENIA Z GMAIL:');
        const connectionOK = await testGmailConnection();

        if (!connectionOK) {
            console.log('❌ Nie można połączyć z Gmail SMTP');
            console.log('📋 INSTRUKCJA KONFIGURACJI:');
            console.log('   1. Idź do https://myaccount.google.com/security');
            console.log('   2. Włącz "2-Step Verification"');
            console.log('   3. Idź do "App passwords"');
            console.log('   4. Wygeneruj hasło dla "Mail"');
            console.log('   5. Dodaj do .env: GMAIL_APP_PASSWORD=twoje-hasło-aplikacji');
            console.log('   6. Dodaj do .env: GMAIL_USER=zabavchukmaks21@gmail.com');
            return;
        }

        // Test 2: Send test email to admin
        console.log('\n2. 📧 TEST EMAILA DO ADMINA:');
        const adminResult = await sendEmailGmail('zabavchukmaks21@gmail.com', {
            subject: '🆓 Test Gmail SMTP - System działa!',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #10b981; border-radius: 10px;">
                <h2 style="color: #10b981;">🆓 Gmail SMTP Test - SUKCES!</h2>
                <p><strong>Darmowy system email działa perfekcyjnie!</strong></p>
                <ul>
                    <li>✅ Koszt: 0 PLN</li>
                    <li>✅ Limit: 500 emaili dziennie</li>
                    <li>✅ Wysyłanie do wszystkich adresów</li>
                    <li>✅ Profesjonalne HTML emaile</li>
                </ul>
                <p>Data testu: ${new Date().toLocaleString('pl-PL')}</p>
                <p><strong>Provider:</strong> Gmail SMTP</p>
            </div>
            `
        });

        console.log('   ✅ Email do admina wysłany!');
        console.log('   📧 Message ID:', adminResult.id);
        console.log('   🔧 Provider:', adminResult.provider);

        // Test 3: Send test email to external address
        console.log('\n3. 📧 TEST EMAILA DO ZEWNĘTRZNEGO ADRESU:');
        const externalResult = await sendEmailGmail('zapasyzszafy@gmail.com', {
            subject: '🎉 Twoje konto Cartechstore zostało aktywowane!',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #2563eb; border-radius: 10px;">
                <h2 style="color: #2563eb;">🎉 Konto aktywowane!</h2>
                <p>Witaj <strong>Ania</strong>!</p>
                <p>Twoje konto w Cartechstore zostało pomyślnie aktywowane.</p>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>📧 System email:</strong> Gmail SMTP (darmowy)</p>
                    <p><strong>📅 Data aktywacji:</strong> ${new Date().toLocaleString('pl-PL')}</p>
                    <p><strong>🎯 Status:</strong> Email dostarczony pomyślnie!</p>
                </div>
                <a href="http://localhost:3005/pages/login.html" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                   Zaloguj się teraz
                </a>
            </div>
            `
        });

        console.log('   ✅ Email do użytkownika wysłany!');
        console.log('   📧 Message ID:', externalResult.id);
        console.log('   👥 Adresaci zaakceptowani:', externalResult.accepted);

        console.log('\n🎯 PODSUMOWANIE SYSTEMU GMAIL:');
        console.log('================================');
        console.log('💰 Koszt: DARMOWY');
        console.log('📊 Limit: 500 emaili/dzień');
        console.log('🌍 Zasięg: Wszystkie adresy email');
        console.log('⚡ Szybkość: Natychmiastowa');
        console.log('🎨 HTML: Pełne wsparcie');
        console.log('🔒 Bezpieczeństwo: OAuth2 + App Password');

        console.log('\n📋 KONFIGURACJA:');
        console.log('================');
        console.log('1. Gmail Account: zabavchukmaks21@gmail.com');
        console.log('2. App Password: (wygenerowane w Google Account)');
        console.log('3. Daily Limit: 500 emails (wystarczające dla B2B)');
        console.log('4. No domain needed: Używa gmail.com');

    } catch (error) {
        console.error('❌ Błąd testu Gmail:', error.message);

        if (error.message.includes('Invalid login')) {
            console.log('\n🔧 ROZWIĄZANIE:');
            console.log('Błędne hasło aplikacji. Sprawdź:');
            console.log('1. Czy masz włączoną weryfikację 2-etapową');
            console.log('2. Czy wygenerowałeś App Password');
            console.log('3. Czy App Password jest w .env jako GMAIL_APP_PASSWORD');
        }
    } finally {
        process.exit(0);
    }
}

testGmailSystem();
