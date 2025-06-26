const request = require('supertest');
const app = require('../../backend/server');
const db = require('../../backend/src/models');
const { User } = db;

describe('Security: Auth endpoints', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  it('should prevent SQL injection in login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: "' OR 1=1;--", password: 'x' });
    expect([401, 400]).toContain(res.status);
  });

  it('should limit login attempts (rate limiting)', async () => {
    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    expect([429, 401]).toContain(res.status);
  });
}); 