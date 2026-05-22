import request from 'supertest';
import app from '../../app.js';
import db from '../../models/index.js';

jest.mock('../../services/otp.service.js');

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('POST /api/auth/send-otp', () => {
  it('sends OTP to valid email', async () => {
    const res = await request(app).post('/api/auth/send-otp').send({ email: 'verify@institute.edu' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/OTP sent/);
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('verifies correct OTP', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: 'verify@institute.edu',
      otp: '123456'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.verified).toBe(true);
  });

  it('rejects incorrect OTP', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: 'verify@institute.edu',
      otp: '000000'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid OTP/);
  });
});