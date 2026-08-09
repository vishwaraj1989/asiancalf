const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config({ path: path.resolve(__dirname, '.env') });
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
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// Basic rate limiter
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

// static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
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

app.get('/', (req, res) => {
  res.json({ success: true, message: 'AsianCalf API running' });
});

// Error handler
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

// Don't auto-connect when running tests; tests manage their own DB lifecycle.
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
