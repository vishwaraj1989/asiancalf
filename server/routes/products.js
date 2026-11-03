const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadVideo } = require('../middleware/upload');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.get('/', [
	query('search').optional().isString(),
	query('category').optional().isString(),
	query('featured').optional().isBoolean(),
	query('page').optional().isInt({ min: 1 }),
], validate, productController.listProducts);
router.get('/:id', [param('id').isMongoId()], validate, productController.getProduct);

// admin routes
router.post('/', protect, authorize('admin'), [
	body('name').notEmpty(),
	body('sku').notEmpty(),
	body('price').isNumeric(),
	body('category').optional().isMongoId(),
	body('salePrice').optional().isNumeric(),
	body('stock').optional().isInt({ min: 0 }),
	body('homePageOrder').optional().isInt({ min: 0 }),
], validate, productController.createProduct);

router.put('/:id', protect, authorize('admin'), [
	param('id').isMongoId(),
	body('name').optional().notEmpty(),
	body('sku').optional().notEmpty(),
	body('price').optional().isNumeric(),
	body('category').optional().isMongoId(),
	body('salePrice').optional().isNumeric(),
	body('stock').optional().isInt({ min: 0 }),
	body('homePageOrder').optional().isInt({ min: 0 }),
], validate, productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), [param('id').isMongoId()], validate, productController.deleteProduct);

// upload multiple images
router.post('/:id/images', protect, authorize('admin'), [param('id').isMongoId()], upload.array('images', 5), productController.uploadImages);
router.post('/:id/video', protect, authorize('admin'), [param('id').isMongoId()], uploadVideo.single('video'), productController.uploadVideo);

module.exports = router;
