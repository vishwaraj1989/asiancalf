const Counter = require('../models/Counter');
const Order = require('../models/Order');

const prefix = 'AC';

function pad(num, size = 4) {
  return String(num).padStart(size, '0');
}

async function generateOrderNumber() {
  // Format: ACYYYYMMDD0001
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const counterId = `order_${ymd}`;

  // Atomically increment per-day counter
  const updated = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // If this was just created and seq is 1, ensure we don't collide with existing orders for today
  if (updated.seq === 1) {
    // find max existing orderNumber for today and set seq accordingly
    const regex = new RegExp(`^${prefix}${ymd}(\\d+)$`);
    const last = await Order.find({ orderNumber: { $regex: `^${prefix}${ymd}` } })
      .sort({ orderNumber: -1 })
      .limit(1)
      .lean();
    if (last && last.length) {
      const m = last[0].orderNumber.match(regex);
      if (m && m[1]) {
        const existingSeq = parseInt(m[1], 10);
        if (!Number.isNaN(existingSeq) && existingSeq >= updated.seq) {
          const bumped = existingSeq + 1;
          const bumpedDoc = await Counter.findOneAndUpdate(
            { _id: counterId },
            { $set: { seq: bumped } },
            { new: true }
          );
          return `${prefix}${ymd}${pad(bumpedDoc.seq)}`;
        }
      }
    }
  }

  return `${prefix}${ymd}${pad(updated.seq)}`;
}

module.exports = generateOrderNumber;
