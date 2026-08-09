const Coupon = require('../models/Coupon');

exports.listCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};

exports.getCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const existing = await Coupon.findOne({ code: req.body.code });
    if (existing) return res.status(400).json({ success: false, message: 'Coupon code already exists' });

    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    if (req.body.code) {
      const existing = await Coupon.findOne({ code: req.body.code, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: c });
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const c = await Coupon.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    next(err);
  }
};
