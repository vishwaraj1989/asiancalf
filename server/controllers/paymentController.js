const Payment = require('../models/Payment');

exports.listPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).populate('order');
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    const p = await Payment.findById(req.params.id).populate('order');
    if (!p) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: p });
  } catch (err) {
    next(err);
  }
};
