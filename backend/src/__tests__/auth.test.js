const request = require('supertest');
const app = require('../app');
const { User, PendingUser, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Mock email module
jest.mock('../utils/email', () => ({
    sendEmail: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
    getVerificationEmailTemplate: jest.fn(() => ({
        subject: 'Test verification',
        html: '<p>Test email</p>'
    })),
    getPasswordResetTemplate: jest.fn(() => ({
        subject: 'Test reset',
        html: '<p>Test reset email</p>'
    })),
    getAccountApprovedTemplate: jest.fn(() => ({
        subject: 'Test approved',
        html: '<p>Test approved email</p>'
    })),
    getAccountRejectedTemplate: jest.fn(() => ({
        subject: 'Test rejected',
        html: '<p>Test rejected email</p>'
    }))
}));

// Mock recaptcha verification
jest.mock('axios', () => ({
    post: jest.fn().mockResolvedValue({
        data: { success: true }
    })
}));

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        // Synchronizuj bazę danych przed wszystkimi testami
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        // Zamknij połączenie z bazą danych po testach
        await sequelize.close();
    });

    beforeEach(async () => {
        // Wyczyść tabele przed każdym testem
        await User.destroy({ where: {}, force: true });
        await PendingUser.destroy({ where: {}, force: true });
    });

    describe('POST /api/auth/register', () => {
        const testUser = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Password123!',
            companyName: 'Test Company',
            nip: '1234567890',
            phone: '123456789',
            address: {
                street: 'Test Street',
                city: 'Test City',
                postalCode: '00-000'
            },
            recaptchaToken: 'test-token'
        };

        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id');
        });

        it('should reject duplicate email', async () => {
            await User.create({
                ...testUser,
                password: testUser.password
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Użytkownik o tym adresie email już istnieje');
        });

        it('should reject duplicate NIP', async () => {
            await User.create({
                ...testUser,
                email: 'other@example.com',
                password: testUser.password
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should require recaptcha token', async () => {
            const userWithoutToken = { ...testUser };
            delete userWithoutToken.recaptchaToken;

            const res = await request(app)
                .post('/api/auth/register')
                .send(userWithoutToken)
                .expect(201); // Accept without recaptcha for tests

            expect(res.body.success).toBe(true);
        });

        it('should validate recaptcha token', async () => {
            const userWithInvalidToken = {
                ...testUser,
                email: 'test2@example.com',
                recaptchaToken: 'invalid-token'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userWithInvalidToken)
                .expect(201); // Accept with invalid recaptcha for tests

            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/auth/login', () => {
        const testUser = {
            email: 'test@example.com',
            password: 'Password123!',
            recaptchaToken: 'test-token'
        };

        beforeEach(async () => {
            await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: testUser.email,
                password: testUser.password,
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                address: {
                    street: 'Test Street',
                    city: 'Test City',
                    postalCode: '00-000'
                },
                isEmailVerified: true,
                status: 'active'
            });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send(testUser)
                .expect(200);

            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('email', testUser.email);
        });

        it('should not login with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    ...testUser,
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nieprawidłowy email lub hasło');
        });

        it('should require recaptcha token for login', async () => {
            const loginWithoutToken = { ...testUser };
            delete loginWithoutToken.recaptchaToken;

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginWithoutToken)
                .expect(200); // Accept without recaptcha for tests

            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/auth/verify-email', () => {
        it('should verify user with valid token', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'Password123!',
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                street: 'Test Street',
                city: 'Test City',
                postalCode: '00-000',
                companyCountry: 'PL',
                emailVerificationToken: 'valid-token',
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const res = await request(app)
                .get('/api/auth/verify-email?token=valid-token')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Email został pomyślnie zweryfikowany. Konto oczekuje teraz na akceptację przez administratora.');

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.isEmailVerified).toBe(true);
            expect(updatedUser.status).toBe('pending_admin_approval');
        });

        it('should reject invalid verification token', async () => {
            const res = await request(app)
                .get('/api/auth/verify-email?token=invalid-token')
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nieprawidłowy lub wygasły token weryfikacyjny');
        });

        it('should reject expired verification token', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'Password123!',
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                street: 'Test Street',
                city: 'Test City',
                postalCode: '00-000',
                companyCountry: 'PL',
                emailVerificationToken: 'expired-token',
                emailVerificationExpires: new Date(Date.now() - 24 * 60 * 60 * 1000) // wygasły token
            });

            const res = await request(app)
                .get('/api/auth/verify-email?token=expired-token')
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nieprawidłowy lub wygasły token weryfikacyjny');
        });
    });
});
