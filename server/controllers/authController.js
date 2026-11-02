const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res, next) => {
  try {
    const { name, mobile, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({ name, mobile, email, password: hashed });
    const token = generateToken(user);
    res.status(201).json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isActive === false) return res.status(403).json({ success: false, message: 'Account is disabled' });
    const token = generateToken(user);
    res.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // For stateless JWT, logout is handled client-side by deleting token.
    // Optionally implement token blacklist here.
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    // Placeholder: in production use refresh tokens
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const token = generateToken(user);
    res.json({ success: true, data: { token } });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
