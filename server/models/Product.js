const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, index: true, unique: true, sparse: true },
    shortDescription: { type: String },
    sku: { type: String, required: true, unique: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    // Amazon-style browse hierarchy. The existing category relation is retained
    // for backward compatibility with already-seeded products.
    department: { type: String, trim: true, index: true },
    productCategory: { type: String, trim: true, index: true },
    subcategory: { type: String, trim: true, index: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: [String],
    primaryImage: { type: String },
    video: { type: String },
    weight: { type: Number },
    brand: { type: String },
    marketplaceUrl: { type: String, trim: true },
    marketplaceUrls: [{ type: String, trim: true }],
    specifications: { type: mongoose.Schema.Types.Mixed },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    numReviews: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

productSchema.virtual('discountPct').get(function () {
  const dp = typeof this.discountPrice !== 'undefined' ? this.discountPrice : this.salePrice;
  if (dp && this.price) {
    return Math.round(((this.price - dp) / this.price) * 100);
  }
  return 0;
});

// generate slug if missing
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-');
}

productSchema.pre('save', async function (next) {
  if (!this.slug && this.name) {
    let base = slugify(this.name);
    let slug = base;
    let i = 1;
    const Product = mongoose.model('Product');
    while (await Product.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${i++}`;
    }
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
