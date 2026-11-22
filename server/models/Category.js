const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    level: { type: Number, enum: [1, 2, 3], default: 3, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
    // Legacy fields retained for existing category data and product filtering.
    department: { type: String, trim: true },
    parentCategory: { type: String, trim: true },
    description: { type: String },
    image: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
