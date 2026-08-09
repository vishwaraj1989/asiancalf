const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

exports.getInventory = async (req, res, next) => {
  try {
    const inv = await Inventory.findOne({ product: req.params.productId }).populate('product');
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });
    res.json({ success: true, data: inv });
  } catch (err) {
    next(err);
  }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const updates = {};
    ['currentStock', 'reservedStock', 'lowStockThreshold'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = Number(req.body[field]);
    });

    if (updates.reservedStock !== undefined && updates.currentStock !== undefined && updates.reservedStock > updates.currentStock) {
      return res.status(400).json({ success: false, message: 'Reserved stock cannot exceed current stock' });
    }

    if (updates.currentStock !== undefined && updates.reservedStock === undefined) {
      const existing = await Inventory.findOne({ product: productId });
      if (existing && existing.reservedStock > updates.currentStock) {
        return res.status(400).json({ success: false, message: 'Current stock cannot be less than existing reserved stock' });
      }
    }

    const inv = await Inventory.findOneAndUpdate({ product: productId }, updates, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, data: inv });
  } catch (err) {
    next(err);
  }
};

exports.listLowStock = async (req, res, next) => {
  try {
    const list = await Inventory.find({ $expr: { $lte: ['$currentStock', '$lowStockThreshold'] } }).populate('product');
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};
