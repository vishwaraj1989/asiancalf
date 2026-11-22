const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validateRequest');
const { register, login, getProfile, logout, refreshToken } = require('../controllers/authController');
const { setupAdmin } = require('../controllers/adminSetupController');
const { protect } = require('../middleware/auth');

const adminSetupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin setup attempts. Try again later.' },
});

router.post('/register', [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })], validate, register);
router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, login);
router.post('/admin-setup', adminSetupLimiter, setupAdmin);
router.post('/logout', protect, logout);
router.post('/refresh', protect, refreshToken);
router.get('/me', protect, getProfile);

module.exports = router;
