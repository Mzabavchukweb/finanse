const request = require('supertest');
const app = require('../app');
const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock email module
jest.mock('../utils/email', () => ({
    sendEmail: jest.fn().mockResolvedValue({ id: 'test-email-id' })
}));

describe('User Profile Management', () => {
    let testUser;
    let authToken;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.destroy({ where: {}, force: true });

        // Create test user
        testUser = await User.create({
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
            isEmailVerified: true,
            status: 'active',
            role: 'user'
        });

        // Generate auth token
        authToken = jwt.sign(
            { id: testUser.id, email: testUser.email, role: testUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    });

    describe('GET /api/users/profile', () => {
        it('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.user).toHaveProperty('firstName', 'Test');
            expect(res.body.user).toHaveProperty('lastName', 'User');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .expect(401);

            expect(res.body.message).toBe('Brak tokena.');
        });

        it('should reject request with invalid token', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(res.body.message).toBe('Nieprawidłowy token.');
        });
    });

    describe('PUT /api/users/profile', () => {
        const validUpdateData = {
            firstName: 'Updated',
            lastName: 'Name',
            email: 'updated@example.com',
            phone: '987654321',
            companyName: 'Updated Company',
            street: 'Updated Street',
            city: 'Updated City',
            postalCode: '11-111'
        };

        it('should update user profile with valid data', async () => {
            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validUpdateData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Profil został zaktualizowany');
            expect(res.body.user.firstName).toBe('Updated');
            expect(res.body.user.lastName).toBe('Name');
            expect(res.body.user.email).toBe('updated@example.com');
        });

        it('should reject update with invalid email format', async () => {
            const invalidData = {
                ...validUpdateData,
                email: 'invalid-email'
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Błędy walidacji');
        });

        it('should reject update with too short firstName', async () => {
            const invalidData = {
                ...validUpdateData,
                firstName: 'A'
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Imię musi mieć od 2 do 50 znaków'
                    })
                ])
            );
        });

        it('should reject update with invalid postal code', async () => {
            const invalidData = {
                ...validUpdateData,
                postalCode: '1234'
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Kod pocztowy musi być w formacie XX-XXX'
                    })
                ])
            );
        });

        it('should reject email already used by another user', async () => {
            // Create another user
            await User.create({
                firstName: 'Other',
                lastName: 'User',
                email: 'other@example.com',
                password: 'Password123!',
                isEmailVerified: true,
                status: 'active',
                role: 'user'
            });

            const invalidData = {
                ...validUpdateData,
                email: 'other@example.com'
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Ten adres email jest już używany przez innego użytkownika');
        });
    });

    describe('PUT /api/users/change-password', () => {
        const currentPassword = 'Password123!';

        it('should change password with valid data', async () => {
            const passwordData = {
                currentPassword,
                newPassword: 'NewPassword123!',
                confirmPassword: 'NewPassword123!'
            };

            const res = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Hasło zostało pomyślnie zmienione');

            // Verify password was actually changed
            const updatedUser = await User.findByPk(testUser.id);
            const isNewPasswordValid = await bcrypt.compare('NewPassword123!', updatedUser.password);
            expect(isNewPasswordValid).toBe(true);
        });

        it('should reject with incorrect current password', async () => {
            const passwordData = {
                currentPassword: 'WrongPassword123!',
                newPassword: 'NewPassword123!',
                confirmPassword: 'NewPassword123!'
            };

            const res = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Aktualne hasło jest nieprawidłowe');
        });

        it('should reject weak new password', async () => {
            const passwordData = {
                currentPassword,
                newPassword: 'weak',
                confirmPassword: 'weak'
            };

            const res = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: expect.stringContaining('Nowe hasło musi zawierać')
                    })
                ])
            );
        });

        it('should reject when new password does not match confirmation', async () => {
            const passwordData = {
                currentPassword,
                newPassword: 'NewPassword123!',
                confirmPassword: 'DifferentPassword123!'
            };

            const res = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Potwierdzenie hasła nie pasuje do nowego hasła'
                    })
                ])
            );
        });

        it('should reject when new password is same as current', async () => {
            const passwordData = {
                currentPassword,
                newPassword: currentPassword,
                confirmPassword: currentPassword
            };

            const res = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nowe hasło musi być różne od aktualnego');
        });
    });

    describe('DELETE /api/users/account', () => {
        it('should soft delete user account with correct password', async () => {
            const deleteData = {
                password: 'Password123!'
            };

            const res = await request(app)
                .delete('/api/users/account')
                .set('Authorization', `Bearer ${authToken}`)
                .send(deleteData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Konto zostało usunięte');

            // Verify user was soft deleted
            const deletedUser = await User.findByPk(testUser.id);
            expect(deletedUser.status).toBe('inactive');
            expect(deletedUser.email).toBe(`deleted_${testUser.id}@deleted.com`);
            expect(deletedUser.firstName).toBe('Usunięty');
            expect(deletedUser.lastName).toBe('Użytkownik');
        });

        it('should reject deletion with incorrect password', async () => {
            const deleteData = {
                password: 'WrongPassword123!'
            };

            const res = await request(app)
                .delete('/api/users/account')
                .set('Authorization', `Bearer ${authToken}`)
                .send(deleteData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nieprawidłowe hasło');
        });

        it('should reject deletion without password', async () => {
            const res = await request(app)
                .delete('/api/users/account')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Hasło jest wymagane do usunięcia konta');
        });
    });
}); 