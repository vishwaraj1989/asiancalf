const Banner = require('../models/Banner');

exports.listBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
};

exports.createBanner = async (req, res, next) => {
  try {
    const payload = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      image: req.body.image,
      buttonText: req.body.buttonText,
      buttonUrl: req.body.buttonUrl,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      active: req.body.active,
      order: req.body.order !== undefined ? Number(req.body.order) : undefined,
    };

    const b = await Banner.create(payload);
    res.status(201).json({ success: true, data: b });
  } catch (err) {
    next(err);
  }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const updates = {};
    ['title', 'subtitle', 'image', 'buttonText', 'buttonUrl', 'active'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) updates.endDate = new Date(req.body.endDate);
    if (req.body.order !== undefined) updates.order = Number(req.body.order);

    const b = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!b) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: b });
  } catch (err) {
    next(err);
  }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const b = await Banner.findByIdAndDelete(req.params.id);
    if (!b) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    next(err);
  }
};
