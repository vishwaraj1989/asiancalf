const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.get('/product/:productId', [param('productId').isMongoId()], validate, reviewController.getProductReviews);
router.post('/', protect, [body('productId').isMongoId(), body('rating').isInt({ min: 1, max: 5 })], validate, reviewController.addReview);

module.exports = router;
