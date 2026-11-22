export function normalizeCategoryName(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US')
    : '';
}

export function categoryIdForProduct(product) {
  if (typeof product?.category === 'string') return product.category;
  return product?.category?._id || '';
}

export function categoryAssignmentPayload(categoryId) {
  return { category: categoryId };
}

export function productMatchesCategory(product, categoryId, categories) {
  if (!categoryId) return true;
  const productCategoryId = categoryIdForProduct(product);
  if (productCategoryId === categoryId) return true;
  if (productCategoryId && categories.some((item) => item._id === productCategoryId)) return false;
  const selectedCategory = categories.find((category) => category._id === categoryId);
  const selectedName = normalizeCategoryName(selectedCategory?.name);
  if (!selectedName) return false;
  return [product.productCategory, product.categoryName, product.department,
    typeof product.category === 'string' ? product.category : '']
    .some((legacyName) => normalizeCategoryName(legacyName) === selectedName);
}
