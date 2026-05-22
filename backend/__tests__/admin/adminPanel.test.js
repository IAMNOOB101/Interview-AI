import request from 'supertest';
import app from '../../app.js';
import db from '../../models/index.js';

let adminToken;

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
  const res = await request(app).post('/api/auth/signup').send({
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin1234!',
    accountType: 'admin'
  });
  adminToken = res.body.token;
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('Institution management by admin', () => {
  let institutionId;

  it('admin can view pending institutions', async () => {
    await db.Institution.create({
      name: 'Pending College',
      domains: ['college.edu'],
      status: 'PENDING'
    });

    const res = await request(app)
      .get('/api/admin/institutions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);

    institutionId = res.body[0].id;
  });

  it('admin can approve institution', async () => {
    const res = await request(app)
      .post(`/api/admin/institutions/${institutionId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    const updated = await db.Institution.findByPk(institutionId);
    expect(updated.status).toBe('ACTIVE');
  });
});
