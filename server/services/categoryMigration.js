function normalizeCategoryName(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US');
}

function legacyCategoryMatchRegex(categoryName) {
  const normalized = typeof categoryName === 'string'
    ? categoryName.normalize('NFKC').trim().replace(/\s+/gu, ' ')
    : '';
  if (!normalized) return null;
  const escaped = normalized.split(' ').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  return new RegExp(`^${escaped}$`, 'i');
}

function idOf(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

function oldCategoryLabel(product) {
  return product.categoryName || product.productCategory ||
    (typeof product.category === 'string' && !/^[a-f\d]{24}$/i.test(product.category) ? product.category : '') ||
    product.department || (product.category ? String(product.category) : '') || '(none)';
}

function planCategoryMigration(products, categories) {
  const categoriesByName = new Map();
  const categoriesById = new Map(categories.map((category) => [idOf(category._id), category]));
  for (const category of categories) {
    const key = normalizeCategoryName(category.name);
    if (!key) continue;
    const matches = categoriesByName.get(key) || [];
    matches.push(category);
    categoriesByName.set(key, matches);
  }

  const alreadyCategorized = [];
  const safeMatches = [];
  const unmatched = [];
  for (const product of products) {
    const productId = idOf(product._id);
    const existingCategory = categoriesById.get(idOf(product.category));
    const base = {
      productId,
      productName: product.name || '(unnamed product)',
      oldCategory: oldCategoryLabel(product),
    };
    if (existingCategory) {
      alreadyCategorized.push({
        ...base,
        proposedCategory: { id: idOf(existingCategory._id), name: existingCategory.name },
        matchingReason: 'Existing category ObjectId resolves to this category.',
      });
      continue;
    }

    const fields = [
      ['categoryName', product.categoryName],
      ['productCategory', product.productCategory],
      ['category', typeof product.category === 'string' && !/^[a-f\d]{24}$/i.test(product.category) ? product.category : ''],
      ['department', product.department],
    ].filter(([, value]) => typeof value === 'string' && value.trim());
    const fieldMatches = fields.flatMap(([field, value]) => {
      const matches = categoriesByName.get(normalizeCategoryName(value)) || [];
      return matches.map((category) => ({ field, value, category }));
    });
    const proposedIds = [...new Set(fieldMatches.map(({ category }) => idOf(category._id)))];
    const ambiguousCategoryName = fieldMatches.some(({ category }) =>
      (categoriesByName.get(normalizeCategoryName(category.name)) || []).length > 1);

    if (proposedIds.length === 1 && !ambiguousCategoryName) {
      const category = categoriesById.get(proposedIds[0]);
      const reasons = fieldMatches.map(({ field, value }) =>
        `${field} “${value}” ${value === category.name ? 'exactly matches' : 'matches after case/spacing/Unicode normalization'} “${category.name}”`);
      safeMatches.push({
        ...base,
        proposedCategory: { id: idOf(category._id), name: category.name },
        matchingReason: [...new Set(reasons)].join('; '),
        previousCategoryId: product.category == null ? null : idOf(product.category),
        previousCategoryValue: product.category ?? null,
        productMongoId: product._id,
      });
      continue;
    }

    const reason = proposedIds.length > 1 || ambiguousCategoryName
      ? 'Conflicting fields or duplicate normalized category names; manual assignment required.'
      : 'No exact category-name match in categoryName, productCategory, category text, or department.';
    unmatched.push({ ...base, proposedCategory: null, matchingReason: reason });
  }

  return {
    inspected: products.length,
    correctlyCategorized: alreadyCategorized.length,
    safelyMatched: safeMatches.length,
    manuallyAssignable: unmatched.length,
    alreadyCategorized,
    safeMatches,
    unmatched,
  };
}

module.exports = { normalizeCategoryName, legacyCategoryMatchRegex, planCategoryMigration };
