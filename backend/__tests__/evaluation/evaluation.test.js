import request from 'supertest';
import app from '../../app.js';
import db from '../../models/index.js';

jest.mock('../../services/analysis.service.js');
jest.mock('../../services/report.service.js');

let token;

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
  const res = await request(app).post('/api/auth/signup').send({
    fullName: 'Eval User',
    email: 'eval@example.com',
    password: 'Eval1234!',
    accountType: 'professional',
    role: 'devops engineer',
    experience: 4,
    desiredSalary: 100000,
    domain: 'DevOps',
    resume: 'resume.pdf'
  });
  token = res.body.token;
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('POST /api/evaluation/submit', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/evaluation/submit').send({});
    expect(res.statusCode).toBe(401);
  });

  it('submits evaluation and returns score breakdown', async () => {
    const res = await request(app)
      .post('/api/evaluation/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId: 'fake-session-id',
        answers: [
          { questionId: 1, answer: 'Here is how I’d configure CI/CD pipelines…' },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.score).toBeDefined();
    expect(res.body.feedback).toBeDefined();
  });
});
