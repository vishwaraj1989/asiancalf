const User = require('../models/User');

exports.addAddress = async (req, res, next) => {
  try {
    const data = req.body;
    const user = await User.findById(req.user.id);
    user.addresses.push(data);
    // if first address set default
    if (user.addresses.length === 1) user.addresses[0].isDefault = true;
    await user.save();
    res.status(201).json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    const addr = user.addresses.id(id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter((a) => a._id.toString() !== id);
    // ensure one default
    if (!user.addresses.some((a) => a.isDefault) && user.addresses.length) user.addresses[0].isDefault = true;
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.setDefault = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    user.addresses.forEach((a) => (a.isDefault = a._id.toString() === id));
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.listAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};
