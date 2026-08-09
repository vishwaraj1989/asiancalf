const mongoose = require('mongoose');

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
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
