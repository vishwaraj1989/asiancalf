const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    // clear minimal collections
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // create categories
    const categories = await Category.insertMany([
      { name: 'Home & Living', slug: 'home-living', description: 'Home essentials' },
      { name: 'Clothing', slug: 'clothing', description: 'Apparel for men and women' },
      { name: 'Kitchen', slug: 'kitchen', description: 'Kitchenware and utensils' },
    ]);

    // create products
    const products = [
      {
        name: 'Handcrafted Wooden Serving Bowl',
        sku: 'AC-WB-001',
        category: categories[0]._id,
        description: 'Premium mango wood serving bowl made in India',
        price: 1299,
        salePrice: 999,
        stock: 50,
        images: [],
        brand: 'AsianCalf'
      },
      {
        name: 'Cotton Kurta - Blue',
        sku: 'AC-KT-002',
        category: categories[1]._id,
        description: 'Comfortable cotton kurta',
        price: 899,
        salePrice: 699,
        stock: 100,
        images: [],
        brand: 'AsianCalf'
      },
      {
        name: 'Stainless Steel Tawa',
        sku: 'AC-ST-003',
        category: categories[2]._id,
        description: 'Durable stainless steel tawa for everyday cooking',
        price: 599,
        salePrice: 499,
        stock: 80,
        images: [],
        brand: 'AsianCalf'
      }
    ];
    const createdProducts = await Product.insertMany(products);

    // create sample customers
    const customers = [
      { name: 'Ravi Kumar', email: 'ravi@example.com', password: await bcrypt.hash('password123', 10), mobile: '9876543210' },
      { name: 'Anita Sharma', email: 'anita@example.com', password: await bcrypt.hash('password123', 10), mobile: '9123456780' },
    ];
    await User.insertMany(customers);

    // create a couple of reviews
    const customerUser = await User.findOne({ email: 'ravi@example.com' });
    if (customerUser) {
      await require('../models/Review').create({ product: createdProducts[0]._id, user: customerUser._id, rating: 5, comment: 'Beautiful craftsmanship, excellent quality.' });
    }

    // create admin user
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin creation');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(adminPassword, salt);
      await User.create({ name: 'Admin', email: adminEmail, password: hashed, role: 'admin' });
      console.log('Admin user created');
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
};

seed();
