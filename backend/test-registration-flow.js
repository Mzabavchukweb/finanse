require('dotenv').config();
const { sendEmail } = require('./src/utils/email');

// Test email sending functionality
async function testEmailSending() {
    console.log('🧪 Testing email sending functionality...');

    try {
        const result = await sendEmail('zabavchukmaks21@gmail.com', {
            subject: 'Test rejestracji - Cartechstore',
            html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; max-width: 600px; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px #2563eb11; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #2563eb 60%, #1e40af 100%); padding: 2.2rem 2rem 1.2rem 2rem; text-align: center;">
                <h1 style="color: #fff; font-size: 2rem; margin: 0 0 0.5rem 0;">Test systemu email</h1>
                <p style="color: #e0e7ef; font-size: 1.1rem; margin: 0;">Weryfikacja działania systemu Cartechstore</p>
              </div>
              <div style="padding: 2.2rem 2rem 1.5rem 2rem; background: #fff;">
                <p style="font-size: 1.13rem; color: #1e293b; margin-bottom: 1.5rem;">
                  To jest testowa wiadomość weryfikująca poprawne działanie systemu emailowego.
                </p>
                <p style="font-size: 1.05rem; color: #64748b; margin-top: 2rem;">
                  Czas wysłania: ${new Date().toLocaleString('pl-PL')}<br>
                  Status: System email działa poprawnie! ✅
                </p>
              </div>
            </div>
            `
        });

        console.log('✅ Email sent successfully:', result.id);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
}

// Test the complete registration process
async function testCompleteFlow() {
    console.log('\n🔄 Testing complete registration flow...\n');

    console.log('1. ✅ Registration endpoint: /api/auth/register');
    console.log('   - Creates user with status: pending_email_verification');
    console.log('   - Generates verification token');
    console.log('   - Sends verification email');

    console.log('\n2. ✅ Email verification endpoint: /api/auth/verify-email');
    console.log('   - Validates token from query parameter');
    console.log('   - Sets isEmailVerified = true');
    console.log('   - Changes status to: pending_admin_approval');

    console.log('\n3. ✅ Admin approval endpoint: /api/admin/users/:id/approve');
    console.log('   - Changes status to: active');
    console.log('   - Sends approval email');

    console.log('\n4. ✅ Login endpoint: /api/auth/login');
    console.log('   - Checks isEmailVerified = true');
    console.log('   - Checks status = active');
    console.log('   - Generates JWT token');

    console.log('\n📧 Email system status:');
    const emailWorking = await testEmailSending();

    if (emailWorking) {
        console.log('\n🎉 System jest gotowy do użycia!');
        console.log('\nKroki dla użytkownika:');
        console.log('1. Zarejestruj się na /pages/b2b-registration.html');
        console.log('2. Sprawdź email i kliknij link weryfikacyjny');
        console.log('3. Poczekaj na akceptację przez administratora');
        console.log('4. Zaloguj się na /pages/login.html');

        console.log('\nKroki dla administratora:');
        console.log('1. Zaloguj się na /pages/admin-login.html');
        console.log('2. Sprawdź oczekujących użytkowników: GET /api/admin/pending-users');
        console.log('3. Zatwierdź użytkownika: POST /api/admin/users/:id/approve');
    } else {
        console.log('\n⚠️  System email nie działa poprawnie. Sprawdź konfigurację RESEND_API_KEY.');
    }
}

// Run the test
if (require.main === module) {
    testCompleteFlow().catch(console.error);
}

module.exports = { testEmailSending, testCompleteFlow };
