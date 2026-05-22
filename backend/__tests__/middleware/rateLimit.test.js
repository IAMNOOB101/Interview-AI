import request from 'supertest';
import app from '../../app.js';

describe('Rate Limiting Middleware', () => {
  it('blocks repeated requests after threshold', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).get('/api/auth/guest');
    }

    const blocked = await request(app).get('/api/auth/guest');
    expect(blocked.statusCode).toBe(429);
    expect(blocked.text).toMatch(/Too many requests/);
  });
});
