import request from 'supertest';
import app from '../../app.js';
import db from '../../models/index.js';

let token;
let sessionId;

beforeAll(async () => {
  await db.sequelize.sync({ force: true });

  const res = await request(app).post('/api/auth/signup').send({
    fullName: 'Report User',
    email: 'report@example.com',
    password: 'Report123!',
    accountType: 'professional',
    role: 'tester',
    experience: 1,
    domain: 'QA',
    desiredSalary: 50000,
    resume: 'resume.pdf'
  });

  token = res.body.token;

  const interview = await request(app)
    .post('/api/interview/start')
    .set('Authorization', `Bearer ${token}`);

  sessionId = interview.body.sessionId;
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('GET /api/reports/download/:sessionId', () => {
  it('allows download within 24h window', async () => {
    const res = await request(app)
      .get(`/api/reports/download/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
  });

  it('blocks download after 24h expiration', async () => {
    const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await db.InterviewSession.update(
      { expiresAt: expiredTime },
      { where: { id: sessionId } }
    );

    const res = await request(app)
      .get(`/api/reports/download/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(410);
    expect(res.body.error).toMatch(/expired/);
  });
});