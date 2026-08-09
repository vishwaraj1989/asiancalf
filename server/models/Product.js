const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    stock: { type: Number, default: 0 },
    images: [String],
    weight: { type: Number },
    brand: { type: String },
    specifications: { type: mongoose.Schema.Types.Mixed },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.virtual('discountPct').get(function () {
  if (this.salePrice && this.price) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);
