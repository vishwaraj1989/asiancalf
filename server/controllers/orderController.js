const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const generateOrderNumber = require('../utils/generateOrderNumber');

exports.createOrder = async (req, res, next) => {
  let cart;
  try {
    const userId = req.user.id;
    const { addressId, paymentMethod = 'COD' } = req.body;
    cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

    // resolve address
    const user = req.userFull;
    let address;
    if (addressId) address = user.addresses.id(addressId);
    if (!address && req.body.address) address = req.body.address;
    if (!address) return res.status(400).json({ success: false, message: 'Address required' });

    // check stock
    for (const item of cart.items) {
      const prod = await Product.findById(item.product._id);
      if (!prod) return res.status(400).json({ success: false, message: 'Product not found' });
      if (prod.stock < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock for ${prod.name}` });
    }

    const subtotal = cart.items.reduce((s, i) => s + i.qty * i.price, 0);
    const deliveryCharge = subtotal > 2000 ? 0 : 50;
    const discount = 0;
    const total = subtotal + deliveryCharge - discount;

    const orderNumber = await generateOrderNumber();
    const items = cart.items.map((i) => ({ product: i.product._id, name: i.product.name, sku: i.product.sku, qty: i.qty, price: i.price }));

    // non-transactional: decrement stock with checks, create order, delete cart; rollback on failures
    const decremented = [];
    for (const item of cart.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: true }
      );
      if (!updated) {
        // rollback
        for (const d of decremented) {
          try { await Product.findByIdAndUpdate(d._id, { $inc: { stock: d.qty } }); } catch (e) {}
        }
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}` });
      }
      decremented.push({ _id: updated._id, qty: item.qty });
    }

    const createdOrder = await Order.create({ orderNumber, user: userId, items, address, subtotal, discount, deliveryCharge, total, paymentMethod, paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending' });

    await Cart.findOneAndDelete({ user: userId });

    return res.status(201).json({ success: true, data: createdOrder });
  } catch (err) {
    // best-effort rollback if possible
    try {
      if (cart && cart.items && cart.items.length) {
        for (const item of cart.items) {
          try { await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: item.qty } }); } catch (e) {}
        }
      }
    } catch (e) {}
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // ensure owner or admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// admin: list orders with filters
exports.listOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.orderStatus = req.query.status;
    if (req.query.search) filter.orderNumber = new RegExp(req.query.search, 'i');
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user');
    res.json({ success: true, data: { orders, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.orderStatus = status;
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
