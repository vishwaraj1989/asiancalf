const Category = require('../models/Category');
const { storeCategoryHierarchy } = require('../data/storeCategoryCatalog');

async function ensureStoreCategoryCatalog() {
  for (const departmentEntry of storeCategoryHierarchy) {
    const departmentSlug = `department-${departmentEntry.department.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    const department = await Category.findOneAndUpdate(
      { $or: [{ slug: departmentSlug }, { name: departmentEntry.department, level: 1 }] },
      {
        $set: { name: departmentEntry.department, slug: departmentSlug, level: 1, department: departmentEntry.department, parentId: null, departmentId: null, sortOrder: departmentEntry.sortOrder, isActive: true, active: true },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    for (const categoryEntry of departmentEntry.categories) {
      const categorySlug = `category-${departmentEntry.department}-${categoryEntry.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const category = await Category.findOneAndUpdate(
        { $or: [{ slug: categorySlug }, { name: categoryEntry.name, departmentId: department._id, level: 2 }] },
        {
          $set: {
            name: categoryEntry.name,
            slug: categorySlug,
            level: 2,
            parentId: department._id,
            departmentId: department._id,
            department: departmentEntry.department,
            sortOrder: categoryEntry.sortOrder,
            isActive: true,
            active: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      for (const subcategoryEntry of categoryEntry.subcategories) {
        const subcategorySlug = `subcategory-${departmentEntry.department}-${categoryEntry.name}-${subcategoryEntry.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await Category.findOneAndUpdate(
          { $or: [{ slug: subcategorySlug }, { name: subcategoryEntry.name, parentId: category._id, departmentId: department._id, level: 3 }] },
          {
            $set: {
              name: subcategoryEntry.name,
              slug: subcategorySlug,
              level: 3,
              parentId: category._id,
              departmentId: department._id,
              department: departmentEntry.department,
              parentCategory: categoryEntry.name,
              sortOrder: subcategoryEntry.sortOrder,
              isActive: true,
              active: true,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
  }
}

module.exports = { ensureStoreCategoryCatalog };
