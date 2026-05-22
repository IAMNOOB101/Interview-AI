import request from 'supertest';
import app from '../../app.js';
import db from '../../models/index.js';

jest.mock('../../services/openrouter.service.js');
jest.mock('../../services/resumeParser.js');

let token;

beforeAll(async () => {
  await db.sequelize.sync({ force: true });

  const signupRes = await request(app).post('/api/auth/signup').send({
    fullName: 'John Interviewee',
    email: 'john@example.com',
    password: 'Interview123!',
    accountType: 'professional',
    role: 'backend developer',
    experience: 2,
    desiredSalary: 60000,
    domain: 'Node.js',
    resume: 'john_resume.pdf'
  });
  token = signupRes.body.token;
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('POST /api/interview/start', () => {
  it('rejects unauthenticated users', async () => {
    const res = await request(app).post('/api/interview/start').send({});
    expect(res.statusCode).toBe(401);
  });

  it('starts interview session and generates questions', async () => {
    const res = await request(app)
      .post('/api/interview/start')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.questions.length).toBeGreaterThan(0);
  });
});
