const Inquiry = require('../models/Inquiry');
const Product = require('../models/Product');
const User = require('../models/User');
const { notifyInquiry } = require('../services/inquiryNotifications');

exports.createInquiry = async (req, res, next) => {
  try {
    const product = await Product.findById(req.body.product).select('name createdBy');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    // Admins create and own the catalog products, so they can receive inquiries
    // as the seller for those products as well.
    const seller = product.createdBy && await User.findOne({
      _id: product.createdBy,
      role: { $in: ['seller', 'admin'] },
      isActive: true,
    }).select('_id');
    if (!seller) return res.status(422).json({ success: false, message: 'Seller information is unavailable.' });
    const data = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
      product: product._id,
      productName: product.name,
      seller: seller._id,
    };
    const inquiry = await Inquiry.create(data);
    notifyInquiry(inquiry);
    res.status(201).json({ success: true, data: inquiry, message: 'Your inquiry has been sent successfully. The seller will contact you shortly.' });
  } catch (err) {
    next(err);
  }
};

exports.getSellerInquiries = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = req.user.role === 'admin' ? {} : { seller: req.user.id };
    if (req.query.status && ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.date) {
      const start = new Date(`${req.query.date}T00:00:00.000Z`);
      const end = new Date(`${req.query.date}T23:59:59.999Z`);
      if (!Number.isNaN(start.getTime())) filter.createdAt = { $gte: start, $lte: end };
    }
    if (req.query.search?.trim()) {
      const search = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingProducts = await Product.find({ name: search }).select('_id').lean();
      filter.$or = [
        { name: search }, { email: search }, { phone: search },
        { product: { $in: matchingProducts.map((product) => product._id) } },
      ];
    }
    const sellerFilter = req.user.role === 'admin' ? {} : { seller: req.user.id };
    const [total, inquiries, groupedStats] = await Promise.all([
      Inquiry.countDocuments(filter),
      Inquiry.find(filter).populate('product', 'name primaryImage images sku').populate('seller', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Inquiry.aggregate([{ $match: sellerFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const stats = groupedStats.reduce((result, item) => ({ ...result, [item._id]: item.count }), { NEW: 0, CONTACTED: 0, CONVERTED: 0, CLOSED: 0 });
    res.json({ success: true, data: inquiries, stats, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.updateSellerInquiry = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.sellerNote !== undefined) updates.sellerNote = req.body.sellerNote;
    const ownershipFilter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, seller: req.user.id };
    const inquiry = await Inquiry.findOneAndUpdate(ownershipFilter, updates, { new: true, runValidators: true })
      .populate('product', 'name primaryImage images sku').populate('seller', 'name email');
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    res.json({ success: true, data: inquiry });
  } catch (err) { next(err); }
};
