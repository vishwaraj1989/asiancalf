const ReturnRequest = require('../models/ReturnRequest');

exports.requestReturn = async (req, res, next) => {
  try {
    const data = { ...req.body, user: req.user.id };
    const r = await ReturnRequest.create(data);
    res.status(201).json({ success: true, data: r });
  } catch (err) {
    next(err);
  }
};

exports.listReturns = async (req, res, next) => {
  try {
    const list = await ReturnRequest.find().populate('user').sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

exports.updateReturnStatus = async (req, res, next) => {
  try {
    const r = await ReturnRequest.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Return request not found' });
    r.status = req.body.status || r.status;
    await r.save();
    res.json({ success: true, data: r });
  } catch (err) {
    next(err);
  }
};
