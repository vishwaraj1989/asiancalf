const Review = require('../models/Review');
const Product = require('../models/Product');

exports.addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating) return res.status(400).json({ success: false, message: 'Product and rating required' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const review = await Review.create({ product: productId, user: req.user.id, rating, comment });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name');
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};
