const bcrypt = require('bcryptjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mediaStore = require('../services/productMediaStorage');
const { setupDB, teardownDB } = require('./setup');

let server;
let adminToken;
let customerToken;
let productId;
let orderId;
let imageUrl;
const adminEmail = 'workflow-admin@test.local';
const customerEmail = 'workflow-customer@test.local';
const testSecret = 'workflow-only-jwt-secret';

beforeAll(async () => {
  process.env.JWT_SECRET = testSecret;
  await setupDB();
  server = app.listen(0);

  await User.create({
    name: 'Workflow Admin',
    email: adminEmail,
    password: await bcrypt.hash('Admin123!', 10),
    role: 'admin',
  });
  const login = await request(server).post('/api/auth/login').send({ email: adminEmail, password: 'Admin123!' });
  adminToken = login.body.data.token;
}, 60000);

afterAll(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await teardownDB();
});

describe('customer and admin workflows against an isolated MongoDB database', () => {
  test('admin authorization, dashboard, product assignment, edit, and GridFS media upload/retrieval', async () => {
    expect(adminToken).toBeTruthy();

    const deniedDashboard = await request(server).get('/api/admin/dashboard');
    expect(deniedDashboard.status).toBe(401);

    const registration = await request(server).post('/api/auth/register').send({
      name: 'Workflow Customer', email: customerEmail, password: 'Customer123!',
    });
    expect(registration.status).toBe(201);
    customerToken = registration.body.data.token;

    const deniedAdmin = await request(server).get('/api/admin/dashboard').set('Authorization', `Bearer ${customerToken}`);
    expect(deniedAdmin.status).toBe(403);
    const deniedProductCreate = await request(server).post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`).send({ name: 'No permission', sku: 'NO-PERM', price: 50 });
    expect(deniedProductCreate.status).toBe(403);

    const dashboard = await request(server).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data).toHaveProperty('totalProducts');
    expect(dashboard.body.data).toHaveProperty('totalOrders');

    const created = await request(server).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Workflow Key Holder', sku: 'WF-KEY-HOLDER', price: 199, salePrice: 149, stock: 10,
      department: 'Home, Kitchen & Outdoors', productCategory: 'Home Decor', subcategory: 'Decorative Accessories',
      homePageOrder: 1, active: true,
    });
    expect(created.status).toBe(201);
    productId = created.body.data._id;
    expect(created.body.data).toMatchObject({ department: 'Home, Kitchen & Outdoors', productCategory: 'Home Decor', subcategory: 'Decorative Accessories' });

    const edited = await request(server).put(`/api/products/${productId}`).set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Updated Workflow Key Holder', price: 225, department: 'Home, Kitchen & Outdoors', productCategory: 'Home Decor', subcategory: 'Decorative Accessories',
    });
    expect(edited.status).toBe(200);
    expect(edited.body.data.name).toBe('Updated Workflow Key Holder');

    const upload = await request(server).post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('primaryImageIndex', '0')
      .attach('images', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]), { filename: 'workflow.png', contentType: 'image/png' });
    expect(upload.status).toBe(200);
    imageUrl = upload.body.data.primaryImage;
    expect(imageUrl).toMatch(/^\/uploads\/products\//);

    const media = await request(server).get(imageUrl);
    expect(media.status).toBe(200);
    expect(media.headers['content-type']).toMatch(/image\/png/);
    expect(media.body).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]));
    expect(await mediaStore.findLatest(imageUrl.split('/').pop())).toBeTruthy();
  });

  test('registration/login/logout, product browsing/details, cart changes, address, COD order, and order history', async () => {
    const login = await request(server).post('/api/auth/login').send({ email: customerEmail, password: 'Customer123!' });
    expect(login.status).toBe(200);
    customerToken = login.body.data.token;

    const profile = await request(server).get('/api/auth/me').set('Authorization', `Bearer ${customerToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.data.email).toBe(customerEmail);

    const productList = await request(server).get('/api/products?search=Workflow%20Key%20Holder&limit=100');
    expect(productList.status).toBe(200);
    expect(productList.body.data.products.some((item) => item._id === productId)).toBe(true);
    const productDetails = await request(server).get(`/api/products/${productId}`);
    expect(productDetails.status).toBe(200);
    expect(productDetails.body.data.images).toContain(imageUrl);
    expect(productDetails.body.data.department).toBe('Home, Kitchen & Outdoors');

    const noImageProduct = await Product.create({ name: 'Legacy Product Without Image', sku: 'WF-NO-IMAGE', price: 50, stock: 1 });
    const noImageDetails = await request(server).get(`/api/products/${noImageProduct._id}`);
    expect(noImageDetails.status).toBe(200);
    expect(noImageDetails.body.data.images).toHaveLength(0);
    await noImageProduct.deleteOne();

    let cart = await request(server).post('/api/cart/add').set('Authorization', `Bearer ${customerToken}`).send({ productId, qty: 2 });
    expect(cart.status).toBe(200);
    expect(cart.body.data.items[0].qty).toBe(2);
    cart = await request(server).post('/api/cart/update').set('Authorization', `Bearer ${customerToken}`).send({ productId, qty: 3 });
    expect(cart.status).toBe(200);
    expect(cart.body.data.items[0].qty).toBe(3);
    cart = await request(server).post('/api/cart/update').set('Authorization', `Bearer ${customerToken}`).send({ productId, qty: 0 });
    expect(cart.status).toBe(200);
    expect(cart.body.data.items).toHaveLength(0);
    await request(server).post('/api/cart/add').set('Authorization', `Bearer ${customerToken}`).send({ productId, qty: 2 }).expect(200);

    const addressResponse = await request(server).post('/api/addresses').set('Authorization', `Bearer ${customerToken}`).send({
      fullName: 'Workflow Customer', mobile: '9876543210', house: '1', street: 'Main Road', area: 'Central', city: 'Delhi', state: 'Delhi', pinCode: '110001',
    });
    expect(addressResponse.status).toBe(201);
    const addressId = addressResponse.body.data[0]._id;
    const addresses = await request(server).get('/api/addresses').set('Authorization', `Bearer ${customerToken}`);
    expect(addresses.body.data[0].isDefault).toBe(true);

    const orderResponse = await request(server).post('/api/orders').set('Authorization', `Bearer ${customerToken}`).send({ addressId, paymentMethod: 'COD' });
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.data.paymentMethod).toBe('COD');
    orderId = orderResponse.body.data._id;
    const afterOrderCart = await request(server).get('/api/cart').set('Authorization', `Bearer ${customerToken}`);
    expect(afterOrderCart.body.data.items).toHaveLength(0);

    const myOrders = await request(server).get('/api/orders/my').set('Authorization', `Bearer ${customerToken}`);
    expect(myOrders.status).toBe(200);
    expect(myOrders.body.data.some((order) => order._id === orderId)).toBe(true);
    const orderDetails = await request(server).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${customerToken}`);
    expect(orderDetails.status).toBe(200);
    expect(orderDetails.body.data.items[0].name).toBe('Updated Workflow Key Holder');

    const logout = await request(server).post('/api/auth/logout').set('Authorization', `Bearer ${customerToken}`);
    expect(logout.status).toBe(200);
  });

  test('admin order management and deletion retain historical order records', async () => {
    const unauthorizedOrders = await request(server).get('/api/orders').set('Authorization', `Bearer ${customerToken}`);
    expect(unauthorizedOrders.status).toBe(403);

    const list = await request(server).get('/api/orders?limit=100').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    const listedOrder = list.body.data.orders.find((order) => order._id === orderId);
    expect(listedOrder).toBeTruthy();
    expect(listedOrder.user.password).toBeUndefined();

    const updated = await request(server).put(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'Processing' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.orderStatus).toBe('Processing');

    const deleted = await request(server).delete(`/api/products/${productId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    const retainedOrder = await Order.findById(orderId);
    expect(retainedOrder).toBeTruthy();
    const removedMedia = await request(server).get(imageUrl);
    expect(removedMedia.status).toBe(404);
  });

  test('production CORS allows both storefront domains and rejects an unrelated origin', async () => {
    const allowed = await request(server).get('/health').set('Origin', 'https://asiancalf.com');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://asiancalf.com');
    const wwwAllowed = await request(server).get('/health').set('Origin', 'https://www.asiancalf.com');
    expect(wwwAllowed.headers['access-control-allow-origin']).toBe('https://www.asiancalf.com');
    const preflight = await request(server).options('/api/cart')
      .set('Origin', 'https://asiancalf.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('https://asiancalf.com');
    expect(preflight.headers['access-control-allow-headers']).toMatch(/authorization/i);
    const rejected = await request(server).get('/health').set('Origin', 'https://unrelated.example');
    expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('legacy local product media URLs still resolve when the file exists', async () => {
    const filename = `workflow-legacy-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
    const diskPath = path.join(__dirname, '..', 'uploads', 'products', filename);
    const data = Buffer.from('legacy-test-image');
    let createdByThisTest = false;
    try {
      await fs.writeFile(diskPath, data, { flag: 'wx' });
      createdByThisTest = true;
      const response = await request(server).get(`/uploads/products/${filename}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(data);
    } finally {
      if (createdByThisTest) await fs.unlink(diskPath);
    }
  });
});

test('configured integration database URI must be isolated from ordinary production database names', () => {
  const { isolatedTestMongoUri } = require('./setup');
  expect(() => isolatedTestMongoUri('mongodb://127.0.0.1:27017/asiancalf')).toThrow(/must end in/);
  expect(() => isolatedTestMongoUri('not-a-mongodb-uri')).toThrow(/valid MongoDB URI/);
  const uri = new URL(isolatedTestMongoUri('mongodb://127.0.0.1:27017/asiancalf_test'));
  expect(uri.pathname).toMatch(/asiancalf_test_\d+_\d+_test$/);
});
