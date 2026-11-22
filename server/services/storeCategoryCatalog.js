const Category = require('../models/Category');
const { storeCategoryCatalog } = require('../data/storeCategoryCatalog');

async function ensureStoreCategoryCatalog() {
  const operations = storeCategoryCatalog.map(({ slug, ...category }) => ({
    updateOne: {
      filter: { slug },
      update: {
        $set: { department: category.department, parentCategory: category.parentCategory },
        $setOnInsert: { name: category.name, slug, description: category.description },
      },
      upsert: true,
    },
  }));
  await Category.bulkWrite(operations, { ordered: true });
}

module.exports = { ensureStoreCategoryCatalog };
