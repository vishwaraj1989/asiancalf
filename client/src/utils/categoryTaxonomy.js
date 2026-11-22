export function categoryDepartments(categories) {
  return [...new Set(categories.map((category) => category.department || 'Other products'))].sort();
}

export function categoryParents(categories, department) {
  return [...new Set(categories
    .filter((category) => (category.department || 'Other products') === department)
    .map((category) => category.parentCategory || 'Existing categories'))].sort();
}

export function categoryLeaves(categories, department, parentCategory) {
  return categories
    .filter((category) => (category.department || 'Other products') === department)
    .filter((category) => (category.parentCategory || 'Existing categories') === parentCategory)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function categorySelectionForProduct(product, categories) {
  const categoryId = typeof product?.category === 'string'
    ? product.category
    : product?.category?._id || '';
  const linkedCategory = categories.find((category) => category._id === categoryId);
  return {
    department: product?.department || linkedCategory?.department || (linkedCategory ? 'Other products' : ''),
    productCategory: product?.productCategory || linkedCategory?.parentCategory || (linkedCategory ? 'Existing categories' : ''),
    subcategory: product?.subcategory || linkedCategory?.name || '',
    categoryId,
  };
}
