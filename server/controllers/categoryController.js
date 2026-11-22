const Category = require('../models/Category');
const Product = require('../models/Product');
const path = require('node:path');
const fs = require('node:fs/promises');

function slugify(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeCreatePayload(body) {
  const level = Number(body.level);
  if (![1, 2, 3].includes(level)) throw Object.assign(new Error('Category level must be 1, 2, or 3.'), { status: 400 });
  if (level > 1 && !body.parentId) throw Object.assign(new Error('A parent category is required.'), { status: 400 });
  if (level === 3 && !body.departmentId) throw Object.assign(new Error('A department is required.'), { status: 400 });
  return {
    name: body.name.trim(),
    slug: body.slug?.trim() ? slugify(body.slug.trim()) : slugify(body.name),
    parentId: level === 1 ? null : body.parentId,
    departmentId: level === 1 ? null : body.departmentId,
    level,
    image: body.image || '',
    description: body.description || '',
    isActive: body.isActive !== false,
    active: body.isActive !== false,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
  };
}

exports.listCategories = async (req, res, next) => {
  try {
    const filter = req.query.includeInactive === 'true'
      ? {}
      : { $or: [{ isActive: true }, { isActive: { $exists: false } }, { active: true }] };
    const categories = await Category.find(filter).sort({ level: 1, sortOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.getCategory = async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const payload = normalizeCreatePayload(req.body);
    const parent = payload.parentId ? await Category.findById(payload.parentId).lean() : null;
    if (payload.level > 1 && !parent) return res.status(400).json({ success: false, message: 'Parent category not found.' });
    const department = payload.departmentId ? await Category.findById(payload.departmentId).lean() : null;
    if (payload.level === 3 && (!department || department.level !== 1)) return res.status(400).json({ success: false, message: 'Invalid department.' });
    if (payload.level === 2 && parent.level !== 1) return res.status(400).json({ success: false, message: 'Main categories must belong directly to a department.' });
    if (payload.level === 3 && parent.level !== 2) return res.status(400).json({ success: false, message: 'Subcategories must belong to a main category.' });
    const duplicate = await Category.findOne({ name: { $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, parentId: payload.parentId });
    if (duplicate) return res.status(409).json({ success: false, message: 'A category with this name already exists under the same parent.' });
    const slugExists = await Category.findOne({ slug: payload.slug });
    if (slugExists) return res.status(409).json({ success: false, message: 'Slug must be unique.' });
    const cat = await Category.create({
      ...payload,
      department: payload.level === 1 ? payload.name : department?.name,
      parentCategory: payload.level === 3 ? parent.name : undefined,
    });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const existing = await Category.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });
    const payload = normalizeCreatePayload({ ...existing.toObject(), ...req.body, level: req.body.level ?? existing.level });
    if (req.body.name) payload.name = req.body.name.trim();
    if (req.body.slug) payload.slug = slugify(req.body.slug.trim());
    if (payload.parentId) {
      const duplicate = await Category.findOne({
        _id: { $ne: existing._id },
        name: { $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        parentId: payload.parentId,
      });
      if (duplicate) return res.status(409).json({ success: false, message: 'A category with this name already exists under the same parent.' });
    }
    const slugExists = await Category.findOne({ _id: { $ne: existing._id }, slug: payload.slug });
    if (slugExists) return res.status(409).json({ success: false, message: 'Slug must be unique.' });
    const cat = await Category.findByIdAndUpdate(req.params.id, {
      ...payload,
      department: payload.level === 1 ? payload.name : existing.department,
    }, { new: true });
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const childCount = await Category.countDocuments({ parentId: req.params.id });
    if (childCount) return res.status(409).json({ success: false, message: 'Move or delete child categories before deleting this category.' });
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount) return res.status(409).json({ success: false, message: 'This category is assigned to products. Reassign those products before deleting it.' });
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

exports.uploadCategoryImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Select an image file.' });
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (cat.image?.startsWith('/uploads/products/')) await fs.unlink(path.join(__dirname, '..', cat.image)).catch(() => {});
    cat.image = `/uploads/products/${req.file.filename}`;
    await cat.save();
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};
