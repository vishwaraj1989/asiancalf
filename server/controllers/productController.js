const Product = require('../models/Product');
const Category = require('../models/Category');

exports.listProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.availability === 'inStock') filter.stock = { $gt: 0 };
    if (req.query.priceMin || req.query.priceMax) {
      filter.price = {};
      if (req.query.priceMin) filter.price.$gte = Number(req.query.priceMin);
      if (req.query.priceMax) filter.price.$lte = Number(req.query.priceMax);
    }
    if (req.query.search) {
      const q = req.query.search;
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { sku: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
      ];
    }

    let sort = { createdAt: -1 };
    if (req.query.sort === 'priceAsc') sort = { price: 1 };
    if (req.query.sort === 'priceDesc') sort = { price: -1 };
    if (req.query.sort === 'popular') sort = { bestseller: -1 };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).populate('category').sort(sort).skip(skip).limit(limit).lean();

    res.json({ success: true, data: { products, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const payload = {
      name: req.body.name,
      sku: req.body.sku,
      price: Number(req.body.price),
      salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : undefined,
      category: req.body.category,
      description: req.body.description,
      weight: req.body.weight !== undefined ? Number(req.body.weight) : undefined,
      brand: req.body.brand,
      featured: req.body.featured,
      bestseller: req.body.bestseller,
      active: req.body.active,
    };

    if (!payload.name || !payload.sku || !payload.price) {
      return res.status(400).json({ success: false, message: 'Missing required fields: name, sku, price' });
    }

    const existing = await Product.findOne({ sku: payload.sku });
    if (existing) return res.status(400).json({ success: false, message: 'SKU must be unique' });

    if (payload.category) {
      const category = await Category.findById(payload.category);
      if (!category) return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const updates = {};
    const fields = ['name', 'sku', 'price', 'salePrice', 'stock', 'category', 'description', 'weight', 'brand', 'featured', 'bestseller', 'active'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'price' || field === 'salePrice' || field === 'stock' || field === 'weight'
          ? Number(req.body[field])
          : req.body[field];
      }
    });

    if (updates.sku) {
      const existing = await Product.findOne({ sku: updates.sku, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ success: false, message: 'SKU must be unique' });
    }

    if (updates.category) {
      const category = await Category.findById(updates.category);
      if (!category) return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await product.remove();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No files uploaded' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const urls = req.files.map((f) => `/uploads/products/${f.filename}`);
    product.images = product.images.concat(urls);
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};
