import request from 'supertest';
import app from '../../app.js';
import db from '../../models/index.js';

jest.mock('../../services/email.service.js');

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('POST /api/auth/signup', () => {
  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('rejects student signup with non-institutional email', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'Test Student',
      email: 'user@gmail.com',
      password: 'Pass1234!',
      accountType: 'student',
      enrollmentNumber: '12345',
      role: 'developer',
      experience: 0,
      resume: 'resume.pdf',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/institutional email/);
  });

  it('accepts guest signup and returns token', async () => {
    const res = await request(app).post('/api/auth/guest').send({ name: 'Guest User' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('accepts professional signup', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Secure123!',
      accountType: 'professional',
      role: 'designer',
      experience: 3,
      desiredSalary: 80000,
      domain: 'UI/UX',
      resume: 'jane_resume.pdf'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe('jane@example.com');
    expect(res.body.token).toBeDefined();
  });
});
