const storeCategoryGroups = [
  {
    department: 'Home & Living',
    categories: [
      { name: 'Home Decor', subcategories: ['Wall Decor & Hangings', 'Key Holders & Hooks', 'Decorative Accents', 'Clocks', 'Photo Frames', 'Lamps & Lighting'] },
      { name: 'Pooja & Spiritual', subcategories: ['Idols & Statues', 'Pooja Thalis', 'Diyas & Oil Lamps', 'Incense Holders', 'Pooja Accessories'] },
      { name: 'Kitchen & Dining', subcategories: ['Cookware', 'Serveware', 'Tableware', 'Kitchen Tools & Accessories'] },
      { name: 'Storage & Organization', subcategories: ['Organizers', 'Wall Shelves & Racks', 'Storage Boxes'] },
      { name: 'Textiles & Furnishings', subcategories: ['Cushion Covers', 'Table Linen', 'Rugs & Mats'] },
    ],
  },
  {
    department: 'Clothing & Apparel',
    categories: [
      { name: "Women's Ethnic Wear", subcategories: ['Kurtis', 'Sarees', 'Dupattas'] },
      { name: "Men's Ethnic Wear", subcategories: ['Kurtas', 'Shirts', 'Ethnic Accessories'] },
      { name: "Kids' Clothing", subcategories: ['Kids\' Ethnic Clothing', 'Kids\' Everyday Clothing'] },
      { name: 'Fashion Accessories', subcategories: ['Bags', 'Scarves', 'Belts'] },
    ],
  },
  {
    department: 'Jewelry & Accessories',
    categories: [
      { name: 'Artificial Jewelry', subcategories: ['Earrings', 'Necklaces', 'Bangles', 'Jewelry Sets'] },
    ],
  },
  {
    department: 'Gifts & Festive',
    categories: [
      { name: 'Gifts & Handicrafts', subcategories: ['Handmade Gifts', 'Gift Sets', 'Decorative Keepsakes'] },
      { name: 'Festive Decor', subcategories: ['Diwali Decor', 'Festive Accents', 'Rangoli Decor'] },
    ],
  },
];

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const storeCategoryCatalog = storeCategoryGroups.flatMap(({ department, categories }) =>
  categories.flatMap(({ name: parentCategory, subcategories }) =>
    subcategories.map((name) => ({
      name,
      slug: slugify(`${department}-${parentCategory}-${name}`),
      department,
      parentCategory,
      description: `${name} under ${parentCategory} in ${department}.`,
    }))
  )
);

module.exports = { storeCategoryCatalog };
