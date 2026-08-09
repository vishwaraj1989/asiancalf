const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  sku: String,
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
});

const addressSchema = new mongoose.Schema({
  fullName: String,
  mobile: String,
  house: String,
  street: String,
  area: String,
  city: String,
  state: String,
  pinCode: String,
  landmark: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    address: addressSchema,
    subtotal: Number,
    discount: Number,
    deliveryCharge: Number,
    total: Number,
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
