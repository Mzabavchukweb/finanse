const request = require('supertest');
const app = require('../app');
const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock email module
jest.mock('../utils/email', () => ({
    sendEmail: jest.fn().mockResolvedValue({ id: 'test-email-id' })
}));

describe('Admin Panel', () => {
    let adminUser;
    let regularUser;
    let adminToken;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.destroy({ where: {}, force: true });

        // Create admin user
        adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: 'AdminPassword123!',
            isEmailVerified: true,
            status: 'active',
            role: 'admin'
        });

        // Create regular user
        regularUser = await User.create({
            firstName: 'Regular',
            lastName: 'User',
            email: 'user@example.com',
            password: 'UserPassword123!',
            companyName: 'Test Company',
            nip: '1234567890',
            isEmailVerified: true,
            status: 'pending_admin_approval',
            role: 'user'
        });

        // Generate admin token
        adminToken = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    });

    describe('Admin Authentication', () => {
        it('should reject non-admin user accessing admin endpoints', async () => {
            const userToken = jwt.sign(
                { id: regularUser.id, email: regularUser.email, role: 'user' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(res.body.message).toBe('Brak uprawnień.');
        });

        it('should allow admin user accessing admin endpoints', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/admin/stats', () => {
        it('should return admin dashboard statistics', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.stats).toHaveProperty('totalUsers');
            expect(res.body.stats).toHaveProperty('activeUsers');
            expect(res.body.stats).toHaveProperty('pendingUsers');
            expect(res.body.stats).toHaveProperty('inactiveUsers');
            expect(res.body.stats).toHaveProperty('unverifiedUsers');
        });
    });

    describe('GET /api/admin/users', () => {
        it('should return paginated list of users', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.users).toBeInstanceOf(Array);
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('pages');
            expect(res.body).toHaveProperty('currentPage');
        });

        it('should filter users by status', async () => {
            const res = await request(app)
                .get('/api/admin/users?status=pending_admin_approval')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.users.length).toBeGreaterThan(0);
            expect(res.body.users[0].status).toBe('pending_admin_approval');
        });

        it('should search users by name', async () => {
            const res = await request(app)
                .get('/api/admin/users?search=Regular')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.users.length).toBeGreaterThan(0);
            expect(res.body.users[0].firstName).toBe('Regular');
        });
    });

    describe('PUT /api/admin/users/:id/role', () => {
        it('should change user role successfully', async () => {
            const roleData = {
                role: 'admin',
                reason: 'Promotion to admin'
            };

            const res = await request(app)
                .put(`/api/admin/users/${regularUser.id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(roleData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Administrator');

            // Verify role was changed in database
            const updatedUser = await User.findByPk(regularUser.id);
            expect(updatedUser.role).toBe('admin');
        });

        it('should reject invalid role', async () => {
            const roleData = {
                role: 'invalid_role',
                reason: 'Test'
            };

            const res = await request(app)
                .put(`/api/admin/users/${regularUser.id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(roleData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Błędy walidacji');
        });

        it('should prevent admin from changing their own role', async () => {
            const roleData = {
                role: 'user',
                reason: 'Self demotion'
            };

            const res = await request(app)
                .put(`/api/admin/users/${adminUser.id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(roleData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nie możesz zmienić własnej roli');
        });
    });

    describe('POST /api/admin/users/:id/approve', () => {
        it('should approve pending user', async () => {
            const res = await request(app)
                .post(`/api/admin/users/${regularUser.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Użytkownik zatwierdzony i powiadomiony');

            // Verify user status was changed
            const approvedUser = await User.findByPk(regularUser.id);
            expect(approvedUser.status).toBe('active');
        });

        it('should reject approving user without verified email', async () => {
            // Update user to unverified
            await regularUser.update({ isEmailVerified: false });

            const res = await request(app)
                .post(`/api/admin/users/${regularUser.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Użytkownik musi najpierw zweryfikować email');
        });
    });

    describe('POST /api/admin/users/:id/reject', () => {
        it('should reject user and delete account', async () => {
            const rejectData = {
                reason: 'Invalid company data'
            };

            const res = await request(app)
                .post(`/api/admin/users/${regularUser.id}/reject`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(rejectData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Użytkownik odrzucony i powiadomiony');

            // Verify user was deleted
            const deletedUser = await User.findByPk(regularUser.id);
            expect(deletedUser).toBeNull();
        });
    });

    describe('POST /api/admin/users/:id/block', () => {
        it('should block user account', async () => {
            // First approve the user
            await regularUser.update({ status: 'active' });

            const blockData = {
                reason: 'Suspicious activity'
            };

            const res = await request(app)
                .post(`/api/admin/users/${regularUser.id}/block`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(blockData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Użytkownik zablokowany');

            // Verify user was blocked
            const blockedUser = await User.findByPk(regularUser.id);
            expect(blockedUser.status).toBe('inactive');
        });

        it('should prevent admin from blocking themselves', async () => {
            const blockData = {
                reason: 'Self block test'
            };

            const res = await request(app)
                .post(`/api/admin/users/${adminUser.id}/block`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(blockData)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nie możesz zablokować własnego konta');
        });
    });

    describe('POST /api/admin/users/:id/unblock', () => {
        it('should unblock user account', async () => {
            // First block the user
            await regularUser.update({ status: 'inactive' });

            const res = await request(app)
                .post(`/api/admin/users/${regularUser.id}/unblock`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Użytkownik odblokowany');

            // Verify user was unblocked
            const unblockedUser = await User.findByPk(regularUser.id);
            expect(unblockedUser.status).toBe('active');
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should permanently delete user', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Użytkownik został trwale usunięty');

            // Verify user was permanently deleted
            const deletedUser = await User.findByPk(regularUser.id);
            expect(deletedUser).toBeNull();
        });

        it('should prevent admin from deleting themselves', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Nie możesz usunąć własnego konta');
        });
    });

    describe('GET /api/admin/pending-users', () => {
        it('should return users pending approval', async () => {
            const res = await request(app)
                .get('/api/admin/pending-users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.users).toBeInstanceOf(Array);
            expect(res.body.users.length).toBeGreaterThan(0);
            expect(res.body.users[0].status).toBe('pending_admin_approval');
        });
    });

    describe('GET /api/admin/security-logs', () => {
        it('should return security logs', async () => {
            const res = await request(app)
                .get('/api/admin/security-logs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('logs');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('pages');
        });

        it('should filter security logs by event type', async () => {
            const res = await request(app)
                .get('/api/admin/security-logs?eventType=login')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.logs).toBeInstanceOf(Array);
        });
    });
}); 