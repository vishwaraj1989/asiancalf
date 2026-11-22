jest.mock('../models/Product', () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
}));
jest.mock('../models/Category', () => ({ findById: jest.fn() }));
jest.mock('../services/productMediaStorage', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  findLatest: jest.fn(),
}));

const Product = require('../models/Product');
const Category = require('../models/Category');
const mediaStore = require('../services/productMediaStorage');
const productController = require('../controllers/productController');

describe('category-only assignment', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updates only the category reference and preserves unrelated product/media fields', async () => {
    const productId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const categoryId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
    const preserved = {
      _id: productId,
      images: ['/uploads/products/one.jpg'],
      primaryImage: '/uploads/products/one.jpg',
      video: '/uploads/products/one.mp4',
      price: 120,
      stock: 8,
      description: 'Keep this description',
    };
    Category.findById.mockResolvedValue({ _id: categoryId });
    Product.findByIdAndUpdate.mockResolvedValue({ ...preserved, category: categoryId });
    const req = { params: { id: productId }, body: { category: categoryId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await productController.updateProduct(req, res, next);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productId, { category: categoryId }, { new: true, runValidators: true });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ ...preserved, category: categoryId }),
    }));
    expect(next).not.toHaveBeenCalled();
    expect(mediaStore.uploadFile).not.toHaveBeenCalled();
    expect(mediaStore.deleteFile).not.toHaveBeenCalled();
    expect(mediaStore.findLatest).not.toHaveBeenCalled();
  });

  test('category-filtered product reads include ObjectId and normalized legacy-name matches', async () => {
    const category = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Home & Living' };
    Category.findById.mockReturnValue({ lean: async () => category });
    Product.countDocuments.mockReturnValue({ setOptions: jest.fn().mockResolvedValue(1) });
    const query = {
      setOptions() { return this; },
      populate() { return this; },
      sort() { return this; },
      skip() { return this; },
      limit() { return this; },
      lean: async () => [],
    };
    Product.find.mockReturnValue(query);
    const req = { query: { category: category._id } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await productController.listProducts(req, res, next);

    const mongoFilter = Product.countDocuments.mock.calls[0][0];
    const categoryOr = mongoFilter.$and[1].$or;
    expect(categoryOr).toContainEqual({ category: category._id });
    expect(categoryOr.find((clause) => clause.productCategory).productCategory.test('home   & living')).toBe(true);
    expect(categoryOr.find((clause) => clause.categoryName).categoryName.test('HOME & LIVING')).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });
});
