jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const User = require('../models/User');
const app = require('../server');
const { setupAdmin } = require('../controllers/adminSetupController');

const configuredEmail = 'asiancalf@gmail.com';
const setupSecret = 'unit-test-admin-setup-secret-0123456789';
const adminPassword = 'A-unique-admin-passphrase-2026!';

function makeRequest(secret = setupSecret, password = adminPassword) {
  return {
    body: { password },
    get: jest.fn((header) => (header === 'x-admin-setup-secret' ? secret : undefined)),
  };
}

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function runSetup(req = makeRequest(), handler = setupAdmin) {
  const res = makeResponse();
  const next = jest.fn();
  await handler(req, res, next);
  return { req, res, next };
}

let originalEnv;

beforeEach(() => {
  originalEnv = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_SETUP_SECRET: process.env.ADMIN_SETUP_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  };
  process.env.ADMIN_EMAIL = configuredEmail;
  process.env.ADMIN_SETUP_SECRET = setupSecret;
  process.env.JWT_SECRET = 'a-different-jwt-test-secret';
  User.findOne.mockReset();
  User.findOneAndUpdate.mockReset();
  User.create.mockReset();
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('one-time protected admin setup', () => {
  test('is unavailable unless the backend setup secret and intended email are configured', async () => {
    delete process.env.ADMIN_SETUP_SECRET;
    const response = await request(app)
      .post('/api/auth/admin-setup')
      .set('x-admin-setup-secret', setupSecret)
      .send({ password: adminPassword });
    expect(response.status).toBe(404);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('rejects an incorrect setup secret without querying users', async () => {
    const { res } = await runSetup(makeRequest('incorrect secret'));
    expect(res.statusCode).toBe(403);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('rejects passwords shorter than 16 UTF-8 bytes', async () => {
    const { res } = await runSetup(makeRequest(setupSecret, 'short-password'));
    expect(res.statusCode).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('creates only the configured admin and stores a bcrypt hash', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    User.create.mockResolvedValue({});

    const { res, next } = await runSetup();
    const created = User.create.mock.calls[0][0];

    expect(res.statusCode).toBe(200);
    expect(created).toMatchObject({
      name: 'Admin',
      email: configuredEmail,
      role: 'admin',
      isActive: true,
      adminSetupCompleted: true,
    });
    expect(await bcrypt.compare(adminPassword, created.password)).toBe(true);
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(JSON.stringify(res.body)).not.toContain(setupSecret);
    expect(JSON.stringify(res.body)).not.toContain(adminPassword);
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts the documented HTTPS request shape and returns no credentials', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    User.create.mockResolvedValue({});
    const response = await request(app)
      .post('/api/auth/admin-setup')
      .set('x-admin-setup-secret', setupSecret)
      .send({ password: adminPassword });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Admin account setup completed. Remove ADMIN_SETUP_SECRET from the Render environment now.' });
    expect(JSON.stringify(response.body)).not.toContain(setupSecret);
    expect(JSON.stringify(response.body)).not.toContain(adminPassword);
    expect(User.create.mock.calls[0][0].email).toBe(configuredEmail);
  });

  test('updates the intended existing user atomically and never accepts a request email', async () => {
    const existing = { _id: 'user-id', adminSetupCompleted: false };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(existing) });
    User.findOneAndUpdate.mockResolvedValue({ _id: existing._id });

    await runSetup({ ...makeRequest(), body: { email: 'attacker@example.com', password: adminPassword } });
    const [filter, update] = User.findOneAndUpdate.mock.calls[0];

    expect(User.findOne).toHaveBeenCalledWith({ email: configuredEmail });
    expect(filter).toEqual({ _id: existing._id, adminSetupCompleted: { $ne: true } });
    expect(update.$set).toMatchObject({ email: configuredEmail, role: 'admin', isActive: true, adminSetupCompleted: true });
    expect(update.$set).not.toHaveProperty('email', 'attacker@example.com');
    expect(User.create).not.toHaveBeenCalled();
  });

  test('does not reset an existing admin after its setup flag is complete', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'existing-admin', role: 'admin', adminSetupCompleted: true }) });
    const { res } = await runSetup();
    expect(res.statusCode).toBe(409);
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  test('completed state survives reloading the controller module', async () => {
    const persistedUser = { _id: 'user-id', adminSetupCompleted: false };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(persistedUser) });
    User.findOneAndUpdate.mockImplementation(async () => {
      persistedUser.adminSetupCompleted = true;
      return persistedUser;
    });
    const first = await runSetup();
    expect(first.res.statusCode).toBe(200);
    expect(persistedUser.adminSetupCompleted).toBe(true);

    jest.resetModules();
    const restartedUser = require('../models/User');
    const restartedSetup = require('../controllers/adminSetupController').setupAdmin;
    restartedUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(persistedUser) });

    const afterRestart = await runSetup(makeRequest(), restartedSetup);
    expect(afterRestart.res.statusCode).toBe(409);
    expect(restartedUser.findOneAndUpdate).not.toHaveBeenCalled();
    expect(restartedUser.create).not.toHaveBeenCalled();
  });

  test('removing the setup secret disables the endpoint without touching the user record', async () => {
    delete process.env.ADMIN_SETUP_SECRET;
    const { res } = await runSetup();
    expect(res.statusCode).toBe(404);
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('only one simultaneous update of an existing account can succeed', async () => {
    const persistedUser = { _id: 'user-id', adminSetupCompleted: false };
    let completed = false;
    let writeCount = 0;
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(persistedUser) });
    User.findOneAndUpdate.mockImplementation(async () => {
      if (completed) return null;
      completed = true;
      writeCount += 1;
      persistedUser.adminSetupCompleted = true;
      return persistedUser;
    });

    const responses = await Promise.all([runSetup(), runSetup()]);
    expect(responses.map(({ res }) => res.statusCode).sort()).toEqual([200, 409]);
    expect(writeCount).toBe(1);
  });

  test('only one simultaneous creation of a missing account can succeed', async () => {
    let created = false;
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    User.create.mockImplementation(async () => {
      if (created) throw { code: 11000 };
      created = true;
      return {};
    });

    const responses = await Promise.all([runSetup(), runSetup()]);
    expect(responses.map(({ res }) => res.statusCode).sort()).toEqual([200, 409]);
    expect(User.create).toHaveBeenCalledTimes(2);
  });
});
