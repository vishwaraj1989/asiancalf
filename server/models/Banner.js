const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    image: String,
    buttonText: String,
    buttonUrl: String,
    startDate: Date,
    endDate: Date,
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
