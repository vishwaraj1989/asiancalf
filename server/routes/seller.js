const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validateRequest');
const { protect, authorize } = require('../middleware/auth');
const { getSellerInquiries, updateSellerInquiry } = require('../controllers/inquiryController');

const router = express.Router();

router.use(protect, authorize(['seller', 'admin']));
router.get('/inquiries', [
  query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']),
  query('search').optional().isString(), query('date').optional().isISO8601(),
], validate, getSellerInquiries);
router.patch('/inquiries/:id', [
  param('id').isMongoId(), body('status').optional().isIn(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']),
  body('sellerNote').optional().isString().isLength({ max: 2000 }),
], validate, updateSellerInquiry);

module.exports = router;
