const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        qty: Number,
        reason: String,
      },
    ],
    status: { type: String, enum: ['Requested', 'Approved', 'Rejected', 'Picked', 'Completed'], default: 'Requested' },
    comment: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReturnRequest', returnSchema);
