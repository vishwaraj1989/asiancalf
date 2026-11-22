const { legacyCategoryMatchRegex, normalizeCategoryName, planCategoryMigration } = require('../services/categoryMigration');

const categories = [
  { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Kitchen' },
  { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Home & Living' },
];

describe('product category migration preview', () => {
  test('keeps valid existing ObjectId references categorized', () => {
    const plan = planCategoryMigration([
      { _id: 'product-1', name: 'Pan', category: categories[0]._id, productCategory: 'Old label' },
    ], categories);
    expect(plan).toMatchObject({ inspected: 1, correctlyCategorized: 1, safelyMatched: 0, manuallyAssignable: 0 });
    expect(plan.alreadyCategorized[0].proposedCategory).toEqual({ id: categories[0]._id, name: 'Kitchen' });
  });

  test('safely matches only exact names after case, whitespace and Unicode normalization', () => {
    const plan = planCategoryMigration([
      { _id: 'product-2', name: 'Plate', productCategory: '  kITCHEN  ' },
      { _id: 'product-3', name: 'Lamp', categoryName: 'Home   &   Living' },
    ], categories);
    expect(plan.safelyMatched).toBe(2);
    expect(plan.safeMatches.map((row) => row.proposedCategory.name)).toEqual(['Kitchen', 'Home & Living']);
    expect(plan.safeMatches[0].matchingReason).toContain('normalization');
    expect(normalizeCategoryName('  KITCHEN  ')).toBe('kitchen');
    expect(legacyCategoryMatchRegex('Home & Living').test('home   &  living')).toBe(true);
    expect(legacyCategoryMatchRegex('Home & Living').test('Home Living')).toBe(false);
  });

  test('leaves missing, unmatched, conflicting and duplicate normalized names for manual assignment', () => {
    const plan = planCategoryMigration([
      { _id: 'product-4', name: 'Unknown', productCategory: 'Unlisted' },
      { _id: 'product-5', name: 'Conflict', productCategory: 'Kitchen', department: 'Home & Living' },
      { _id: 'product-6', name: 'No labels' },
    ], categories);
    expect(plan.safelyMatched).toBe(0);
    expect(plan.manuallyAssignable).toBe(3);
    expect(plan.unmatched.map((row) => row.productId)).toEqual(['product-4', 'product-5', 'product-6']);
    expect(plan.unmatched[1].matchingReason).toMatch(/Conflicting/);
  });

  test('treats duplicate normalized category names as ambiguous', () => {
    const plan = planCategoryMigration(
      [{ _id: 'product-7', name: 'Cup', productCategory: 'KITCHEN' }],
      [...categories, { _id: 'cccccccccccccccccccccccc', name: ' kitchen ' }]
    );
    expect(plan.safelyMatched).toBe(0);
    expect(plan.unmatched[0].matchingReason).toMatch(/duplicate normalized category names/);
  });
});
