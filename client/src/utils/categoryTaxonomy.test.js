import {
  categoryDepartments,
  categoryLeaves,
  categoryParents,
  categorySelectionForProduct,
} from './categoryTaxonomy';

const categories = [
  { _id: 'leaf-1', department: 'Home & Living', parentCategory: 'Home Decor', name: 'Key Holders' },
  { _id: 'leaf-2', department: 'Home & Living', parentCategory: 'Pooja & Spiritual', name: 'Idols' },
  { _id: 'leaf-3', name: 'Legacy Kitchen' },
];

describe('store category hierarchy', () => {
  test('builds department, category, and subcategory choices', () => {
    expect(categoryDepartments(categories)).toEqual(['Home & Living', 'Other products']);
    expect(categoryParents(categories, 'Home & Living')).toEqual(['Home Decor', 'Pooja & Spiritual']);
    expect(categoryLeaves(categories, 'Home & Living', 'Home Decor')).toEqual([categories[0]]);
  });

  test('preserves existing products and supports categories without hierarchy metadata', () => {
    expect(categorySelectionForProduct({
      category: { _id: 'leaf-1' },
      subcategory: 'Key Holders',
    }, categories)).toEqual({
      department: 'Home & Living',
      productCategory: 'Home Decor',
      subcategory: 'Key Holders',
      categoryId: 'leaf-1',
    });
    expect(categorySelectionForProduct({ category: 'leaf-3' }, categories)).toEqual({
      department: 'Other products',
      productCategory: 'Existing categories',
      subcategory: 'Legacy Kitchen',
      categoryId: 'leaf-3',
    });
  });
});
