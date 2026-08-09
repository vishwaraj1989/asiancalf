const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) return res.json({ success: true, data: { items: [] } });
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const quantity = Math.max(1, parseInt(qty) || 1);
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });
    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) {
      const newQty = existing.qty + quantity;
      if (newQty > product.stock) return res.status(400).json({ success: false, message: 'Insufficient stock' });
      existing.qty = newQty;
    } else {
      cart.items.push({ product: productId, qty: quantity, price: product.salePrice || product.price });
    }
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });
    const product = await Product.findById(productId);
    const quantity = Math.max(0, parseInt(qty) || 0);
    if (quantity === 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
      item.qty = quantity;
      item.price = product.salePrice || product.price;
    }
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};
