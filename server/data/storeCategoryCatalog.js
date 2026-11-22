const catalog = [
  ['Home & Living', ['Home Decor','Wall Decor','Wall Hangings','Key Holders','Decorative Cutouts','Home Furnishing','Clocks','Photo Frames','Artificial Flowers & Plants','Showpieces','Vases & Planters','Home Fragrance','Decorative Accessories']],
  ['Kids & Toys', ['Toys','Educational Toys','Baby Toys','Electronic Toys','Soft Toys','Sport & Outdoor','Pretend Play','Games','Novelty & Gag Toys','Building & Construction Toys','Remote Control Toys','Dolls & Accessories','Musical Toys','Puzzles','Action Figures','Toy Vehicles','Art & Craft Toys','Water & Beach Toys']],
  ['Personal Care & Wellness', ['Skin Care','Hair Care','Body Care','Grooming','Bath Accessories','Personal Hygiene','Beauty Tools','Massage & Wellness']],
  ['Mobiles & Tablets', ['Mobile Phones','Mobile Covers','Screen Protectors','Mobile Chargers','Data Cables','Power Banks','Mobile Holders','Tablet Accessories','Earphones']],
  ['Consumer Electronics', ['Headphones','Speakers','Smart Watches','Cameras','Computer Accessories','Gaming Accessories','Audio Accessories','Electronic Gadgets']],
  ['Appliances', ['Kitchen Appliances','Home Appliances','Cleaning Appliances','Fans','Irons','Water Purifiers','Small Appliances']],
  ['Automotive', ['Car Accessories','Bike Accessories','Car Decor','Dashboard Accessories','Car Organizers','Car Cleaning','Vehicle Lighting','Travel Accessories']],
  ['Beauty & Personal Care', ['Makeup','Makeup Accessories','Nail Art','Beauty Tools','Hair Accessories','Beauty Organizers','Makeup Storage']],
  ['Fashion & Accessories', ['Men\'s Clothing','Women\'s Clothing','Kids Clothing','Men\'s Accessories','Women\'s Accessories','Bags','Wallets','Belts','Watches','Jewellery','Sunglasses']],
  ['Footwear', ['Men\'s Footwear','Women\'s Footwear','Kids Footwear','Casual Shoes','Sports Shoes','Sandals','Slippers']],
  ['Kitchen & Dining', ['Kitchen Tools','Kitchen Storage','Cookware','Tableware','Dinner Sets','Water Bottles','Lunch Boxes','Kitchen Organizers','Dining Accessories']],
  ['Furniture', ['Tables','Chairs','Cabinets','Shelves','Storage Furniture','Home Office Furniture','Decorative Furniture']],
  ['Pooja & Religious Items', ['Pooja Accessories','Pooja Room Decor','Home Mandir','Religious Cutouts','Festival Decorations','Rangoli','Diya & Candle Holders','Spiritual Gifts']],
  ['Garden & Outdoor', ['Garden Decor','Plant Pots','Planters','Gardening Tools','Artificial Plants','Outdoor Accessories','Balcony Decor']],
  ['Lighting & Lamps', ['LED Lights','Decorative Lights','Table Lamps','Night Lamps','Wall Lamps','String Lights','Decorative Lamps']],
  ['Sports & Fitness', ['Cricket','Badminton','Football','Basketball','Fitness Equipment','Yoga Accessories','Outdoor Sports','Indoor Sports']],
  ['Books & Stationery', ['Educational Books','Notebooks','Pens','Office Supplies','School Supplies','Art Supplies','Craft Materials']],
  ['Gifts & Occasions', ['Birthday Gifts','Anniversary Gifts','Wedding Gifts','Festival Gifts','Corporate Gifts','Personalized Gifts','Decorative Gift Items']],
  ['Bags & Luggage', ['Handbags','Backpacks','School Bags','Travel Bags','Laptop Bags','Wallets','Pouches']],
  ['Jewellery & Accessories', ['Earrings','Necklaces','Bracelets','Rings','Anklets','Jewellery Sets','Hair Accessories']],
  ['Pet Supplies', ['Dog Accessories','Cat Accessories','Pet Toys','Pet Beds','Pet Grooming','Pet Feeding Accessories']],
  ['Baby & Maternity', ['Baby Clothing','Baby Care','Baby Feeding','Baby Bedding','Baby Accessories','Baby Safety','Maternity Accessories']],
  ['Home Organization', ['Storage Boxes','Wall Organizers','Kitchen Organizers','Drawer Organizers','Hooks & Hangers','Shoe Organizers','Desk Organizers']],
  ['Office Supplies', ['Office Organizers','Desk Accessories','File Holders','Pen Stands','Office Decor','Computer Desk Accessories']],
  ['Travel Accessories', ['Travel Organizers','Luggage Accessories','Travel Bottles','Passport Holders','Travel Pillows','Travel Essentials']],
  ['Art & Craft', ['DIY Craft Kits','MDF Cutouts','Wooden Crafts','Painting Supplies','Decorative Materials','Craft Tools','Scrapbooking']],
  ['Safety & Security', ['Door Locks','Safety Accessories','Security Cameras','Door Bells','Home Safety Products']],
  ['Automotive Electronics', ['Car Chargers','Phone Holders','Bluetooth Accessories','Car Cameras','Vehicle Electronic Gadgets']],
  ['Party Supplies', ['Birthday Decorations','Balloons','Party Props','Wedding Decorations','Celebration Accessories']],
  ['Seasonal & Festival', ['Diwali Decor','Navratri Decor','Holi Accessories','Christmas Decor','Rakhi','Uttarayan Accessories','Seasonal Decorations']],
];

const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const specificSubcategories = {
  'Electronic Toys': ['Electronic Toys','RC Toys','Musical Electronic Toys','Battery Toys'],
  'MDF Cutouts': ['MDF Key Holders','MDF Rangoli','MDF Religious Cutouts','MDF Wall Hangings','MDF Letters'],
  'Key Holders': ['MDF Key Holders','Wooden Key Holders','Metal Key Holders','Mobile Stand Key Holders','Wall Key Racks'],
  'Religious Cutouts': ['MDF Religious Cutouts','Lakshmi Cutouts','Ganesh Cutouts','Hanuman Cutouts','Krishna Cutouts'],
  'Rangoli': ['MDF Rangoli','Acrylic Rangoli','Printed Rangoli','Rangoli Stencils','Decorative Rangoli'],
};

const storeCategoryHierarchy = catalog.map(([department, categories], departmentIndex) => ({
  department,
  sortOrder: departmentIndex,
  categories: categories.map((category, categoryIndex) => ({
    name: category,
    sortOrder: categoryIndex,
    subcategories: (specificSubcategories[category] || [`All ${category}`])
      .map((name, subcategoryIndex) => ({ name, sortOrder: subcategoryIndex })),
  })),
}));

const storeCategoryCatalog = storeCategoryHierarchy.flatMap(({ department, categories }) =>
  categories.flatMap(({ name: parentCategory, subcategories }) =>
    subcategories.map(({ name }) => ({
      name,
      slug: slugify(`${department}-${parentCategory}-${name}`),
      department,
      parentCategory,
      description: `${name} under ${parentCategory} in ${department}.`,
    }))
  )
);

module.exports = { storeCategoryCatalog, storeCategoryHierarchy, slugify };
