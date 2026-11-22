const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateRequest');
const { createInquiry } = require('../controllers/inquiryController');

const router = express.Router();

router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Please enter your name.'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().normalizeEmail().withMessage('Please enter a valid email address.'),
  body('phone').trim().isLength({ min: 7, max: 30 }).withMessage('Please enter a valid phone number.'),
  body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Please enter a message of at least 5 characters.'),
  body('product').isMongoId().withMessage('Please select a valid product.'),
], validate, createInquiry);

module.exports = router;
