const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validateRequest');
const { register, login, getProfile, logout, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })], validate, register);
router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, login);
router.post('/logout', protect, logout);
router.post('/refresh', protect, refreshToken);
router.get('/me', protect, getProfile);

module.exports = router;
