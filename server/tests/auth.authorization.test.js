jest.mock('../models/User', () => ({ findById: jest.fn() }));

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const makeResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return res;
};

const makeRequest = (token) => ({ headers: { authorization: `Bearer ${token}` } });
const makeToken = (claims, options = {}) => jwt.sign(claims, process.env.JWT_SECRET, options);
let previousJwtSecret;

beforeAll(() => {
  previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-auth-middleware-test-secret';
});

afterAll(() => {
  if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousJwtSecret;
});

beforeEach(() => User.findById.mockReset());

describe('JWT authorization against current account state', () => {
  test('loads the current database role instead of trusting a stale JWT role', async () => {
    const user = { _id: 'user-1', role: 'customer', isActive: true };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const req = makeRequest(makeToken({ id: 'user-1', role: 'admin' }));
    const res = makeResponse();
    const next = jest.fn();

    await protect(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 'user-1', role: 'customer' });
    expect(req.userFull).toBe(user);
    const adminOnly = authorize('admin');
    const adminRes = makeResponse();
    adminOnly(req, adminRes, jest.fn());
    expect(adminRes.statusCode).toBe(403);
  });

  test('immediately rejects a disabled account', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'user-2', role: 'admin', isActive: false }) });
    const req = makeRequest(makeToken({ id: 'user-2', role: 'admin' }));
    const res = makeResponse();
    const next = jest.fn();

    await protect(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Account is disabled');
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a deleted account even when its token is still valid', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const req = makeRequest(makeToken({ id: 'deleted-user', role: 'admin' }));
    const res = makeResponse();
    const next = jest.fn();

    await protect(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects expired tokens before querying the user collection', async () => {
    const req = makeRequest(makeToken({ id: 'user-3', role: 'admin' }, { expiresIn: '-1s' }));
    const res = makeResponse();
    const next = jest.fn();

    await protect(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
