const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const { param } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.get('/', protect, authorize('admin'), paymentController.listPayments);
router.get('/:id', protect, authorize('admin'), [param('id').isMongoId()], validate, paymentController.getPayment);

module.exports = router;
