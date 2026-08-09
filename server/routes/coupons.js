const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const couponController = require('../controllers/couponController');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.get('/', couponController.listCoupons);
router.get('/:id', [param('id').isMongoId()], validate, couponController.getCoupon);

router.post('/', protect, authorize('admin'), [
	body('code').notEmpty(),
	body('discountValue').isNumeric(),
	body('discountType').optional().isIn(['percentage','fixed']),
	body('minOrderValue').optional().isNumeric(),
	body('maxDiscount').optional().isNumeric(),
], validate, couponController.createCoupon);
router.put('/:id', protect, authorize('admin'), [
	param('id').isMongoId(),
	body('code').optional().notEmpty(),
	body('discountValue').optional().isNumeric(),
	body('discountType').optional().isIn(['percentage','fixed']),
	body('minOrderValue').optional().isNumeric(),
	body('maxDiscount').optional().isNumeric(),
], validate, couponController.updateCoupon);
router.delete('/:id', protect, authorize('admin'), [param('id').isMongoId()], validate, couponController.deleteCoupon);

module.exports = router;
