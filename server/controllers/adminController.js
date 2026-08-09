const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

exports.dashboard = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ active: true });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const todaysSalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, orderStatus: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const todaysSales = todaysSalesAgg[0] ? todaysSalesAgg[0].total : 0;
    const totalSalesAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const totalSales = totalSalesAgg[0] ? totalSalesAgg[0].total : 0;

    res.json({
      success: true,
      data: { totalProducts, activeProducts, totalCustomers, totalOrders, pendingOrders, deliveredOrders, cancelledOrders, todaysOrders, todaysSales, totalSales },
    });
  } catch (err) {
    next(err);
  }
};

exports.listCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
};
