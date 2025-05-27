const request = require('supertest');
const app = require('../app');
const { User, PendingUser } = require('../models');
const bcrypt = require('bcryptjs');

describe('Auth Endpoints', () => {
    beforeEach(async () => {
        await User.destroy({ where: {} });
        await PendingUser.destroy({ where: {} });
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
            expect(res.body).toHaveProperty('userId');
            expect(res.body).toHaveProperty('verificationToken');
        });

        it('should reject duplicate email', async () => {
            await User.create({
                ...testUser,
                password: await bcrypt.hash(testUser.password, 10)
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400);

            expect(res.body.error).toBe('Ten adres email jest już zarejestrowany');
        });

        it('should reject duplicate NIP', async () => {
            await User.create({
                ...testUser,
                email: 'other@example.com',
                password: await bcrypt.hash(testUser.password, 10)
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400);

            expect(res.body.error).toBe('Ten NIP jest już zarejestrowany');
        });

        it('should require recaptcha token', async () => {
            const userWithoutToken = { ...testUser };
            delete userWithoutToken.recaptchaToken;

            const res = await request(app)
                .post('/api/auth/register')
                .send(userWithoutToken)
                .expect(400);

            expect(res.body.error).toBe('Token reCAPTCHA jest wymagany');
        });

        it('should validate recaptcha token', async () => {
            const userWithInvalidToken = {
                ...testUser,
                recaptchaToken: 'invalid-token'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userWithInvalidToken)
                .expect(400);

            expect(res.body.error).toBe('Weryfikacja reCAPTCHA nie powiodła się');
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
                password: await bcrypt.hash(testUser.password, 10),
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

            expect(res.body.error).toBe('Nieprawidłowy email lub hasło');
        });

        it('should require recaptcha token for login', async () => {
            const loginWithoutToken = { ...testUser };
            delete loginWithoutToken.recaptchaToken;

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginWithoutToken)
                .expect(400);

            expect(res.body.error).toBe('Token reCAPTCHA jest wymagany');
        });
    });

    describe('GET /api/auth/verify', () => {
        it('should verify user with valid token', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: await bcrypt.hash('Password123!', 10),
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                address: {
                    street: 'Test Street',
                    city: 'Test City',
                    postalCode: '00-000'
                },
                emailVerificationToken: 'valid-token',
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const res = await request(app)
                .get('/api/auth/verify?token=valid-token')
                .expect(200);

            expect(res.body.message).toBe('Konto zostało pomyślnie zweryfikowane');

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.isEmailVerified).toBe(true);
            expect(updatedUser.status).toBe('pending_admin_approval');
        });

        it('should reject invalid verification token', async () => {
            const res = await request(app)
                .get('/api/auth/verify?token=invalid-token')
                .expect(400);

            expect(res.body.error).toBe('Nieprawidłowy lub nieaktualny token weryfikacyjny');
        });

        it('should reject expired verification token', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: await bcrypt.hash('Password123!', 10),
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                address: {
                    street: 'Test Street',
                    city: 'Test City',
                    postalCode: '00-000'
                },
                emailVerificationToken: 'expired-token',
                emailVerificationExpires: new Date(Date.now() - 24 * 60 * 60 * 1000) // wygasły token
            });

            const res = await request(app)
                .get('/api/auth/verify?token=expired-token')
                .expect(400);

            expect(res.body.error).toBe('Nieprawidłowy lub nieaktualny token weryfikacyjny');
        });
    });
});
