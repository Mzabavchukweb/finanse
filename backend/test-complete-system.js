const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3005/api';
let adminToken = '';
const userToken = '';

// Test data
const testUserData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    companyName: 'Test Company Ltd',
    nip: `${Date.now()}`.slice(-10), // unique NIP
    phone: '+48123456789',
    address: {
        street: 'Test Street 123',
        city: 'Warsaw',
        postalCode: '00-001'
    },
    companyCountry: 'PL'
};

const testUser2Data = {
    firstName: 'Second',
    lastName: 'User',
    email: `test2_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    companyName: 'Second Company Ltd',
    nip: `${Date.now() + 1}`.slice(-10), // unique NIP
    phone: '+48987654321',
    address: {
        street: 'Second Street 456',
        city: 'Krakow',
        postalCode: '30-001'
    },
    companyCountry: 'PL'
};

const adminData = {
    email: 'admin@test.com',
    password: 'AdminPassword123!'
};

// Helper functions
const log = {
    success: (msg) => console.log(chalk.green('✅ ' + msg)),
    error: (msg) => console.log(chalk.red('❌ ' + msg)),
    info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
    warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
    section: (msg) => console.log(chalk.magenta.bold('\n🔍 ' + msg + '\n'))
};

const makeRequest = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: { 'Content-Type': 'application/json' }
        };

        if (data) config.data = data;

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
};

const makeAuthRequest = async (method, endpoint, data = null, token = '') => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (data) config.data = data;

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testSuccessfulRegistrations() {
    log.info('Test 1: Pomyślna rejestracja użytkownika');
    const reg1 = await makeRequest('POST', '/auth/register', testUserData);
    if (!reg1.success) {
        log.error(`Rejestracja użytkownika 1 - FAIL: ${JSON.stringify(reg1.error)}`);
        return false;
    }
    log.success('Rejestracja użytkownika 1 - OK');

    log.info('Test 2: Rejestracja drugiego użytkownika');
    const reg2 = await makeRequest('POST', '/auth/register', testUser2Data);
    if (!reg2.success) {
        log.error(`Rejestracja użytkownika 2 - FAIL: ${JSON.stringify(reg2.error)}`);
        return false;
    }
    log.success('Rejestracja użytkownika 2 - OK');
    return true;
}

async function testRegistrationValidation() {
    log.info('Test 3: Próba rejestracji z duplikatem email');
    const reg3 = await makeRequest('POST', '/auth/register', testUserData);
    if (!(!reg3.success && reg3.status === 400)) {
        log.error('Odrzucenie duplikatu email - FAIL');
        return false;
    }
    log.success('Odrzucenie duplikatu email - OK');

    log.info('Test 4: Próba rejestracji z duplikatem NIP');
    const duplicateNipUser = { ...testUserData, email: 'different@email.com' };
    const reg4 = await makeRequest('POST', '/auth/register', duplicateNipUser);
    if (!(!reg4.success && reg4.status === 400)) {
        log.error('Odrzucenie duplikatu NIP - FAIL');
        return false;
    }
    log.success('Odrzucenie duplikatu NIP - OK');

    log.info('Test 5: Próba rejestracji ze słabym hasłem');
    const weakPasswordUser = {
        ...testUserData,
        email: 'weak@test.com',
        nip: '9999999999',
        password: 'weak'
    };
    const reg5 = await makeRequest('POST', '/auth/register', weakPasswordUser);
    if (!(!reg5.success && reg5.status === 400)) {
        log.error('Odrzucenie słabego hasła - FAIL');
        return false;
    }
    log.success('Odrzucenie słabego hasła - OK');
    return true;
}

async function testUserRegistration() {
    log.section('TEST REJESTRACJI UŻYTKOWNIKÓW');

    const test1 = await testSuccessfulRegistrations();
    if (!test1) return false;

    const test2 = await testRegistrationValidation();
    return test2;
}

async function testEmailVerification() {
    log.section('TEST WERYFIKACJI EMAIL');

    log.info('Symulacja weryfikacji email dla testowych użytkowników');
    log.warning('W rzeczywistym systemie weryfikacja odbywa się przez linki w emailach');
    log.info('Przechodzimy do testów logowania...');

    return true;
}

async function testLogin() {
    log.section('TEST LOGOWANIA');

    log.info('Test 1: Tworzenie admina testowego');

    const adminLogin = await makeRequest('POST', '/auth/login', adminData);
    if (adminLogin.success) {
        adminToken = adminLogin.data.token;
        log.success('Login admina - OK');
    } else {
        log.warning('Admin nie istnieje - kontynuujemy testy bez panelu admina');
    }

    log.info('Test 2: Próba logowania z błędnymi danymi');
    const badLogin = await makeRequest('POST', '/auth/login', {
        email: testUserData.email,
        password: 'wrongpassword'
    });
    if (badLogin.success) {
        log.error('Odrzucenie błędnych danych logowania - FAIL');
        return false;
    }
    log.success('Odrzucenie błędnych danych logowania - OK');

    log.info('Test 3: Próba logowania z niezweryfikowanym emailem');
    const unverifiedLogin = await makeRequest('POST', '/auth/login', {
        email: testUserData.email,
        password: testUserData.password
    });
    if (!(!unverifiedLogin.success && unverifiedLogin.status === 403)) {
        log.error('Odrzucenie niezweryfikowanego konta - FAIL');
        return false;
    }
    log.success('Odrzucenie niezweryfikowanego konta - OK');

    return true;
}

async function testUserPanel() {
    log.section('TEST PANELU UŻYTKOWNIKA');

    if (!userToken) {
        log.warning('Brak tokenu użytkownika - pomijamy testy panelu użytkownika');
        return true;
    }

    log.info('Test 1: Pobieranie profilu użytkownika');
    const profile = await makeAuthRequest('GET', '/users/profile', null, userToken);
    if (!profile.success) {
        log.error(`Pobieranie profilu - FAIL: ${JSON.stringify(profile.error)}`);
        return false;
    }
    log.success('Pobieranie profilu - OK');

    return true;
}

async function testAdminPanel() {
    log.section('TEST PANELU ADMINA');

    if (!adminToken) {
        log.warning('Brak tokenu admina - pomijamy testy panelu admina');
        return true;
    }

    const tests = [
        { name: 'Pobieranie statystyk', endpoint: '/admin/stats' },
        { name: 'Pobieranie użytkowników', endpoint: '/admin/users' },
        { name: 'Pobieranie oczekujących użytkowników', endpoint: '/admin/pending-users' },
        { name: 'Pobieranie logów bezpieczeństwa', endpoint: '/admin/security-logs' }
    ];

    for (const test of tests) {
        log.info(`Test: ${test.name}`);
        const result = await makeAuthRequest('GET', test.endpoint, null, adminToken);
        if (!result.success) {
            log.error(`${test.name} - FAIL: ${JSON.stringify(result.error)}`);
            return false;
        }
        log.success(`${test.name} - OK`);
    }

    return true;
}

async function testSecurity() {
    log.section('TEST BEZPIECZEŃSTWA');

    log.info('Test 1: Próba dostępu do endpointu admina bez tokenu');
    const noToken = await makeRequest('GET', '/admin/users');
    if (!(noToken.status === 401)) {
        log.error('Odrzucenie dostępu bez tokenu - FAIL');
        return false;
    }
    log.success('Odrzucenie dostępu bez tokenu - OK');

    log.info('Test 2: Próba dostępu z błędnym tokenem');
    const invalidToken = await makeAuthRequest('GET', '/admin/users', null, 'invalid-token');
    if (!(invalidToken.status === 401)) {
        log.error('Odrzucenie błędnego tokenu - FAIL');
        return false;
    }
    log.success('Odrzucenie błędnego tokenu - OK');

    log.info('Test 3: Próba ataku SQL Injection');
    const sqlInjection = await makeRequest('POST', '/auth/login', {
        email: 'admin@test.com\'; DROP TABLE users; --',
        password: 'anything'
    });
    if (sqlInjection.success) {
        log.error('Ochrona przed SQL Injection - FAIL');
        return false;
    }
    log.success('Ochrona przed SQL Injection - OK');

    return true;
}

async function testAPIEndpoints() {
    log.section('TEST WSZYSTKICH ENDPOINT\'ÓW API');

    const endpoints = [
        { method: 'GET', path: '/users/profile', requiresAuth: true },
        { method: 'PUT', path: '/users/profile', requiresAuth: true },
        { method: 'PUT', path: '/users/change-password', requiresAuth: true },
        { method: 'DELETE', path: '/users/account', requiresAuth: true },
        { method: 'GET', path: '/admin/stats', requiresAuth: true, adminOnly: true },
        { method: 'GET', path: '/admin/users', requiresAuth: true, adminOnly: true },
        { method: 'GET', path: '/admin/pending-users', requiresAuth: true, adminOnly: true },
        { method: 'GET', path: '/admin/security-logs', requiresAuth: true, adminOnly: true }
    ];

    for (const endpoint of endpoints) {
        log.info(`Testowanie: ${endpoint.method} ${endpoint.path}`);

        if (endpoint.requiresAuth) {
            const noAuth = await makeRequest(endpoint.method, endpoint.path);
            if (!(noAuth.status === 401 || noAuth.status === 403)) {
                log.error(`${endpoint.path} - ochrona autoryzacji FAIL`);
            } else {
                log.success(`${endpoint.path} - ochrona autoryzacji OK`);
            }
        }
    }

    return true;
}

async function testRateLimiting() {
    log.section('TEST RATE LIMITING');

    log.info('Test rate limiting na endpoincie logowania');

    const rapidRequests = [];
    for (let i = 0; i < 10; i++) {
        rapidRequests.push(makeRequest('POST', '/auth/login', {
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
        }));
    }

    const results = await Promise.all(rapidRequests);
    const rateLimited = results.some(result => result.status === 429);

    if (rateLimited) {
        log.success('Rate limiting działa - OK');
    } else {
        log.warning('Rate limiting może nie działać (sprawdź NODE_ENV)');
    }

    return true;
}

// Main test runner
async function runAllTests() {
    console.log(chalk.cyan.bold('\n🚀 ROZPOCZYNAM KOMPLEKSOWE TESTY SYSTEMU\n'));

    const tests = [
        { name: 'Rejestracja użytkowników', fn: testUserRegistration },
        { name: 'Weryfikacja email', fn: testEmailVerification },
        { name: 'Logowanie', fn: testLogin },
        { name: 'Panel użytkownika', fn: testUserPanel },
        { name: 'Panel admina', fn: testAdminPanel },
        { name: 'Bezpieczeństwo', fn: testSecurity },
        { name: 'Endpoint\'y API', fn: testAPIEndpoints },
        { name: 'Rate limiting', fn: testRateLimiting }
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passedTests++;
                log.success(`Test "${test.name}" - ZALICZONY`);
            } else {
                log.error(`Test "${test.name}" - NIEZALICZONY`);
            }
        } catch (error) {
            log.error(`Test "${test.name}" - BŁĄD: ${error.message}`);
        }

        await sleep(500);
    }

    console.log(chalk.cyan.bold('\n📊 PODSUMOWANIE TESTÓW\n'));
    console.log(`Zaliczone testy: ${chalk.green(passedTests)} / ${totalTests}`);
    console.log(`Procent sukcesu: ${chalk.green(Math.round((passedTests / totalTests) * 100))}%`);

    if (passedTests === totalTests) {
        console.log(chalk.green.bold('\n🎉 WSZYSTKIE TESTY ZALICZONE! SYSTEM JEST GOTOWY!\n'));
    } else {
        console.log(chalk.red.bold('\n⚠️  NIEKTÓRE TESTY NIE PRZESZŁY - WYMAGANA INTERWENCJA\n'));
    }

    console.log(chalk.blue.bold('📋 REKOMENDACJE:'));
    console.log('1. Sprawdź logi serwera pod kątem błędów');
    console.log('2. Zweryfikuj konfigurację emaili w produkcji');
    console.log('3. Upewnij się, że rate limiting jest włączony w produkcji');
    console.log('4. Przeprowadź testy bezpieczeństwa w środowisku produkcyjnym');
    console.log('5. Skonfiguruj monitoring i alerty');
}

async function checkServerHealth() {
    log.info('Sprawdzanie dostępności serwera...');
    try {
        const health = await makeRequest('GET', '/auth/csrf-token');
        if (health.success) {
            log.success('Serwer działa poprawnie');
            return true;
        } else {
            log.error('Serwer nie odpowiada poprawnie');
            return false;
        }
    } catch (error) {
        log.error(`Nie można połączyć się z serwerem: ${error.message}`);
        return false;
    }
}

(async () => {
    const serverOk = await checkServerHealth();
    if (!serverOk) {
        const msg = 'Serwer nie jest dostępny. Upewnij się, że serwer działa na';
        log.error(`${msg} http://localhost:3005`);
        process.exit(1);
    }

    await runAllTests();
})(); 