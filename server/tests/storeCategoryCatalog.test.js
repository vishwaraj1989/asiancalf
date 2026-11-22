const { storeCategoryCatalog } = require('../data/storeCategoryCatalog');

jest.mock('../models/Category', () => ({ bulkWrite: jest.fn().mockResolvedValue({}) }));
const Category = require('../models/Category');
const { ensureStoreCategoryCatalog } = require('../services/storeCategoryCatalog');

describe('AsianCalf store category catalog', () => {
  afterEach(() => jest.clearAllMocks());

  test('provides unique, fully classified leaf categories for the store', () => {
    expect(storeCategoryCatalog.length).toBeGreaterThan(100);
    expect(new Set(storeCategoryCatalog.map((category) => category.slug)).size).toBe(storeCategoryCatalog.length);
    expect(storeCategoryCatalog.every((category) =>
      category.name && category.slug && category.department && category.parentCategory
    )).toBe(true);
  });

  test('includes all 13 main departments and the requested MDF category examples', () => {
    const departments = new Set(storeCategoryCatalog.map((category) => category.department));
    expect(departments).toEqual(new Set([
      'Home & Living',
      'Kitchen & Dining',
      'Furniture',
      'Home Organization',
      'Pooja & Religious Items',
      'Car Accessories',
      'Garden & Outdoor',
      'Lighting & Lamps',
      'Fashion & Accessories',
      'Beauty & Personal Care',
      'Electronics',
      'Toys & Games',
      'Gifts & Occasions',
    ]));
    expect(storeCategoryCatalog).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'MDF Key Holders', department: 'Home & Living', parentCategory: 'Home Decor' }),
      expect.objectContaining({ name: 'MDF Rangoli', department: 'Home & Living', parentCategory: 'Home Decor' }),
      expect.objectContaining({ name: 'MDF Religious Cutouts', department: 'Pooja & Religious Items', parentCategory: 'Religious Cutouts' }),
    ]));
  });

  test('upserts the full catalog without overwriting existing category names', async () => {
    await ensureStoreCategoryCatalog();

    expect(Category.bulkWrite).toHaveBeenCalledTimes(1);
    const [operations] = Category.bulkWrite.mock.calls[0];
    expect(operations).toHaveLength(storeCategoryCatalog.length);
    expect(operations[0].updateOne.update.$setOnInsert).toMatchObject({
      name: expect.any(String),
      slug: expect.any(String),
    });
    expect(operations[0].updateOne.update.$set).toEqual({
      department: expect.any(String),
      parentCategory: expect.any(String),
    });
    expect(operations[0].updateOne.upsert).toBe(true);
  });
});
