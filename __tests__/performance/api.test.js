const request = require('supertest');
const app = require('../../backend/server');

describe('Performance: API response time', () => {
  it('should respond to /health in < 500ms', async () => {
    const start = Date.now();
    const res = await request(app).get('/health');
    const duration = Date.now() - start;
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });
}); 