const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.get('/', bannerController.listBanners);

router.post('/', protect, authorize('admin'), [
	body('title').notEmpty(),
	body('image').notEmpty(),
	body('order').optional().isInt(),
], validate, bannerController.createBanner);
router.put('/:id', protect, authorize('admin'), [
	param('id').isMongoId(),
	body('title').optional().notEmpty(),
	body('image').optional().notEmpty(),
	body('order').optional().isInt(),
], validate, bannerController.updateBanner);
router.delete('/:id', protect, authorize('admin'), [param('id').isMongoId()], validate, bannerController.deleteBanner);

module.exports = router;
