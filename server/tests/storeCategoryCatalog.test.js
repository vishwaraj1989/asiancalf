const { storeCategoryCatalog } = require('../data/storeCategoryCatalog');

jest.mock('../models/Category', () => ({
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
  findOneAndUpdate: jest.fn().mockImplementation(async (_filter, update) => {
    if (update.$set.level === 1) return { _id: 'department-id', name: update.$set.name, level: 1 };
    if (update.$set.level === 2) return { _id: 'category-id', name: update.$set.name, level: 2 };
    return { _id: 'subcategory-id', level: 3 };
  }),
}));
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

  test('includes all 30 main departments and requested MDF category examples', () => {
    const departments = new Set(storeCategoryCatalog.map((category) => category.department));
    expect(departments.size).toBe(30);
    expect(departments).toContain('Kids & Toys');
    expect(departments).toContain('Mobiles & Tablets');
    expect(departments).toContain('Seasonal & Festival');
    expect(storeCategoryCatalog).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'MDF Key Holders', department: 'Home & Living', parentCategory: 'Key Holders' }),
      expect.objectContaining({ name: 'MDF Rangoli', department: 'Pooja & Religious Items', parentCategory: 'Rangoli' }),
      expect.objectContaining({ name: 'MDF Religious Cutouts', department: 'Pooja & Religious Items', parentCategory: 'Religious Cutouts' }),
    ]));
  });

  test('upserts the full catalog without overwriting existing category names', async () => {
    await ensureStoreCategoryCatalog();
    expect(Category.updateMany).toHaveBeenCalledWith(
      { level: 3, $or: [{ parentId: null }, { parentId: { $exists: false } }] },
      { $set: { isActive: false, active: false } }
    );
    expect(Category.findOneAndUpdate).toHaveBeenCalled();
    expect(Category.findOneAndUpdate.mock.calls.length).toBeGreaterThan(100);
    const departmentCall = Category.findOneAndUpdate.mock.calls.find(([, update]) => update.$set.level === 1);
    expect(departmentCall[1].$set).toMatchObject({ level: 1, parentId: null, departmentId: null });
    const subcategoryCall = Category.findOneAndUpdate.mock.calls.find(([, update]) => update.$set.level === 3);
    expect(subcategoryCall[1].$set).toMatchObject({ level: 3, parentId: expect.anything(), departmentId: expect.anything() });
  });
});
