const { User } = require('./src/models');

(async () => {
    try {
        // Utwórz administratora
        const admin = await User.create({
            email: 'admin@cartechstore.pl',
            password: 'admin123', // będzie automatycznie zahashowane przez hook
            firstName: 'Admin',
            lastName: 'Cartechstore',
            role: 'admin',
            isEmailVerified: true,
            status: 'active',
            companyName: 'Cartechstore Admin',
            companyCountry: 'PL',
            nip: '0000000000',
            phone: '000000000',
            street: 'Administracyjna 1',
            postalCode: '00-000',
            city: 'Warszawa'
        });

        console.log('✅ Administrator utworzony pomyślnie!');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Hasło: admin123');
        console.log('🌐 Panel admina: http://localhost:3005/pages/admin-login.html');

    } catch (error) {
        console.error('❌ Błąd podczas tworzenia administratora:', error.message);
    } finally {
        process.exit(0);
    }
})();
