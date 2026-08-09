const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.use(protect);

router.post('/', [body('addressId').optional().isMongoId(), body('paymentMethod').optional().isString()], validate, orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/:id', [param('id').isMongoId()], validate, orderController.getOrder);

// admin
router.get('/', authorize('admin'), [query('page').optional().isInt({ min: 1 })], validate, orderController.listOrders);
router.put('/:id/status', authorize('admin'), [param('id').isMongoId(), body('status').notEmpty().isString()], validate, orderController.updateOrderStatus);

module.exports = router;
