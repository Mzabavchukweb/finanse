const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testAPI() {
    console.log('🧪 TESTOWANIE API ENDPOINTS');
    console.log('===========================');

    // Test 1: Health check
    try {
        console.log('1. Testing health endpoint...');
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health:', health.data);
    } catch (error) {
        console.log('❌ Health failed:', error.message);
    }

    // Test 2: Public products
    try {
        console.log('\n2. Testing public products...');
        const products = await axios.get(`${BASE_URL}/api/products/public`);
        console.log('✅ Products:', products.data.products?.length || 0, 'products found');
    } catch (error) {
        console.log('❌ Products failed:', error.message);
    }

    // Test 3: Public categories
    try {
        console.log('\n3. Testing public categories...');
        const categories = await axios.get(`${BASE_URL}/api/categories/public`);
        console.log('✅ Categories:', categories.data?.length || 0, 'categories found');
    } catch (error) {
        console.log('❌ Categories failed:', error.message);
    }

    // Test 4: Analytics dashboard (without auth)
    try {
        console.log('\n4. Testing analytics dashboard...');
        const analytics = await axios.get(`${BASE_URL}/api/analytics/dashboard`);
        console.log('✅ Analytics:', analytics.data.overview);
    } catch (error) {
        console.log('❌ Analytics failed:', error.message);
    }

    // Test 5: Analytics recent activity
    try {
        console.log('\n5. Testing recent activity...');
        const activity = await axios.get(`${BASE_URL}/api/analytics/recent-activity`);
        console.log('✅ Recent Activity:', activity.data.recentActivity?.length || 0, 'activities');
    } catch (error) {
        console.log('❌ Recent Activity failed:', error.message);
    }

    console.log('\n🎉 TESTY ZAKOŃCZONE');
}

// Admin login test
async function testAdminLogin() {
    console.log('\n🔐 TESTOWANIE LOGOWANIA ADMIN');
    console.log('==============================');

    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
            email: 'admin@cartechstore.pl',
            password: 'admin123'
        });

        console.log('✅ Admin login successful');
        const token = loginResponse.data.token;

        // Test authenticated endpoints
        console.log('\n6. Testing authenticated categories...');
        const categories = await axios.get(`${BASE_URL}/api/categories`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Admin Categories:', categories.data?.length || 0, 'categories');

        return token;
    } catch (error) {
        console.log('❌ Admin login failed:', error.response?.data || error.message);
        return null;
    }
}

// Run tests
async function runAllTests() {
    await testAPI();
    await testAdminLogin();
}

if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testAPI, testAdminLogin };
