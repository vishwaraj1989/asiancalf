const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, trim: true, maxlength: 200 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'], default: 'NEW', index: true },
  sellerNote: { type: String, trim: true, maxlength: 2000, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
