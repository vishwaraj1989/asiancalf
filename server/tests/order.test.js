const request = require('supertest');
const app = require('../server');
const bcrypt = require('bcryptjs');
const { setupDB, teardownDB } = require('./setup');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

let server;

beforeAll(async () => {
  await setupDB();
  server = app.listen(0);
});

afterAll(async () => {
  await server.close();
  await teardownDB();
});

describe('Order checkout', () => {
  let token;
  let productId;

  beforeAll(async () => {
    const hashed = await bcrypt.hash('password123', 10);
    const user = await User.create({ name: 'Test User', email: 'test@example.com', password: hashed });
    const product = await Product.create({ name: 'Test Product', sku: 'TP001', price: 100, stock: 5 });
    productId = product._id;
    const res = await request(server).post('/api/auth/login').send({ email: 'test@example.com', password: 'password123' });
    token = res.body.data.token;
  });

  test('creates an order and decrements stock', async () => {
    await Cart.create({ user: (await User.findOne({ email: 'test@example.com' }))._id, items: [{ product: productId, qty: 2, price: 100 }] });
    const res = await request(server)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ address: { fullName: 'Test User', mobile: '1234567890', house: '1 Main St', street: 'Street', area: 'Area', city: 'City', state: 'State', pinCode: '123456', landmark: 'None' } });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    const product = await Product.findById(productId);
    expect(product.stock).toBe(3);
  });
});
