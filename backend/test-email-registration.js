require('dotenv').config();
const axios = require('axios');

async function testRegistrationEmail() {
    try {
        console.log('🧪 Testowanie rejestracji z wysyłaniem emaila...');

        const testUser = {
            email: 'test.registration@example.com',
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            companyName: 'Test Company',
            companyCountry: 'PL',
            nip: '1234567890',
            phone: '+48123456789',
            address: {
                street: 'Test Street 123',
                postalCode: '00-001',
                city: 'Warsaw'
            }
        };

        console.log('📋 Dane testowe:', {
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            companyName: testUser.companyName
        });

        const response = await axios.post('http://localhost:3005/api/auth/register', testUser, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Response status:', response.status);
        console.log('✅ Response data:', response.data);

        if (response.data.success) {
            console.log('🎉 Rejestracja zakończona sukcesem!');
            console.log('📧 Email weryfikacyjny powinien zostać wysłany do:', testUser.email);
        } else {
            console.log('❌ Rejestracja niepomyślna:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Błąd testowania rejestracji:', error.response?.data || error.message);
    }
}

testRegistrationEmail();
