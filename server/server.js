const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: path.resolve(__dirname, '.env') });
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const addressRoutes = require('./routes/addresses');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');
const bannerRoutes = require('./routes/banners');
const paymentRoutes = require('./routes/payments');
const inventoryRoutes = require('./routes/inventory');
const returnRoutes = require('./routes/returns');
const inquiryRoutes = require('./routes/inquiries');
const sellerRoutes = require('./routes/seller');
const productMediaRoutes = require('./routes/productMedia');
const productMediaHeaders = require('./middleware/productMediaHeaders');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

const productionOrigins = new Set([
  'https://asiancalf.com',
  'https://www.asiancalf.com',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? productionOrigins
  : new Set([...productionOrigins, 'http://localhost:3000']);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', productMediaHeaders);
app.use('/uploads/products', productMediaRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return res.status(503).json({ success: false, status: 'unavailable', database: 'unavailable' });
  }

  let timeout;
  try {
    await Promise.race([
      mongoose.connection.db.command({ ping: 1 }, { maxTimeMS: 3000 }),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('MongoDB health check timed out')), 4000);
      }),
    ]);
    return res.status(200).json({ success: true, status: 'ok', database: 'connected' });
  } catch (error) {
    console.warn(`MongoDB health check failed: ${error.name || 'Error'}`);
    return res.status(503).json({ success: false, status: 'unavailable', database: 'unavailable' });
  } finally {
    clearTimeout(timeout);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/seller', sellerRoutes);
app.get('/', (req, res) => res.json({ success: true, message: 'AsianCalf API running' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  let server;
  const shutdown = (signal) => {
    console.log(`${signal} received; closing server`);
    if (!server) return process.exit(0);
    server.close(async () => {
      try { await require('mongoose').connection.close(); } catch (error) { console.error('Database shutdown failed:', error.message); }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  (async () => {
    try {
      if (process.env.NODE_ENV !== 'test') await connectDB();
      server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
      console.error(`Backend startup failed: ${error.message}`);
      process.exitCode = 1;
    }
  })();
}

module.exports = app;
