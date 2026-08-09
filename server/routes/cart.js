const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const cartController = require('../controllers/cartController');
const { body } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.use(protect);
router.get('/', cartController.getCart);
router.post('/add', [body('productId').isMongoId(), body('qty').optional().isInt({ min: 1 })], validate, cartController.addToCart);
router.post('/update', [body('productId').isMongoId(), body('qty').isInt({ min: 0 })], validate, cartController.updateItem);
router.post('/clear', cartController.clearCart);

module.exports = router;
