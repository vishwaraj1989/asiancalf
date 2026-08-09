const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
