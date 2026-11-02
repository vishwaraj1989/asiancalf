const request = require('supertest');
const app = require('../server');
const { setupDB, teardownDB } = require('./setup');
const User = require('../models/User');
const Product = require('../models/Product');

let server;

beforeAll(async () => {
  await setupDB();
  server = app.listen(0);
});

afterAll(async () => {
  await server.close();
  await teardownDB();
});

describe('Negative API cases', () => {
  test('health requires a responsive MongoDB connection', async () => {
    const res = await request(server).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, status: 'ok', database: 'connected' });
  });

  test('protected endpoints reject missing token', async () => {
    const res = await request(server).get('/api/cart');
    expect(res.statusCode === 401 || res.statusCode === 403).toBeTruthy();
  });

  test('admin endpoints reject non-admin users', async () => {
    const hashed = await require('bcryptjs').hash('password123', 10);
    const user = await User.create({ name: 'Normal', email: 'normal@test.local', password: hashed });
    const login = await request(server).post('/api/auth/login').send({ email: 'normal@test.local', password: 'password123' });
    const token = login.body && login.body.data && login.body.data.token ? login.body.data.token : null;
    expect(token).toBeTruthy();
    const res = await request(server).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  test('product create validation fails with missing fields', async () => {
    // create admin
    const hashed = await require('bcryptjs').hash('Admin123!', 10);
    await User.create({ name: 'Admin', email: 'admin@test.local', password: hashed, role: 'admin' });
    const login = await request(server).post('/api/auth/login').send({ email: 'admin@test.local', password: 'Admin123!' });
    const token = login.body && login.body.data && login.body.data.token ? login.body.data.token : null;
    expect(token).toBeTruthy();

    const res = await request(server).post('/api/products').set('Authorization', `Bearer ${token}`).send({});
    expect(res.statusCode).toBe(400);
  });

  test('order creation fails when cart is empty', async () => {
    const hashed = await require('bcryptjs').hash('password123', 10);
    const user = await User.create({ name: 'Cartless', email: 'cartless@test.local', password: hashed });
    const login = await request(server).post('/api/auth/login').send({ email: 'cartless@test.local', password: 'password123' });
    const token = login.body && login.body.data && login.body.data.token ? login.body.data.token : null;
    expect(token).toBeTruthy();
    const res = await request(server).post('/api/orders').set('Authorization', `Bearer ${token}`).send({ address: { fullName: 'X' } });
    expect(res.statusCode).toBe(400);
  });
});
