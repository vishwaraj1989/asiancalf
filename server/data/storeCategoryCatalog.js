const storeCategoryGroups = [
  {
    department: 'Home & Living',
    categories: [
      { name: 'Home Decor', subcategories: ['Wall Decor', 'Key Holders', 'Decorative Cutouts', 'Wall Hangings', 'MDF Key Holders', 'Wooden Key Holders', 'Mobile Stand Key Holders', 'MDF Rangoli', 'MDF Religious Cutouts', 'Decorative Accents', 'Clocks', 'Photo Frames'] },
      { name: 'Wall Decor', subcategories: ['Wall Art', 'Wall Clocks', 'Wall Frames', 'Wall Hangings', 'Wall Stickers', 'Name Plates'] },
      { name: 'Key Holders', subcategories: ['MDF Key Holders', 'Wooden Key Holders', 'Mobile Stand Key Holders', 'Designer Key Holders', 'Wall Key Racks'] },
    ],
  },
  {
    department: 'Kitchen & Dining',
    categories: [
      { name: 'Kitchen Tools', subcategories: ['Cooking Tools', 'Utensils', 'Chopping Boards', 'Peelers & Graters', 'Kitchen Gadgets'] },
      { name: 'Storage', subcategories: ['Kitchen Containers', 'Spice Boxes', 'Dry Fruit Boxes', 'Storage Jars', 'Pantry Organizers'] },
      { name: 'Dining Accessories', subcategories: ['Table Mats', 'Table Runners', 'Serveware', 'Coasters', 'Cutlery', 'Tableware'] },
    ],
  },
  {
    department: 'Furniture',
    categories: [
      { name: 'Tables', subcategories: ['Side Tables', 'Coffee Tables', 'Dining Tables', 'Laptop Tables'] },
      { name: 'Chairs', subcategories: ['Dining Chairs', 'Office Chairs', 'Accent Chairs', 'Kids Chairs'] },
      { name: 'Shelves', subcategories: ['Wall Shelves', 'Floating Shelves', 'Corner Shelves', 'Book Shelves'] },
      { name: 'Cabinets', subcategories: ['Display Cabinets', 'Storage Cabinets', 'Kitchen Cabinets', 'Side Cabinets'] },
    ],
  },
  {
    department: 'Home Organization',
    categories: [
      { name: 'Storage Boxes', subcategories: ['Fabric Boxes', 'Wooden Boxes', 'Plastic Boxes', 'Stackable Boxes'] },
      { name: 'Organizers', subcategories: ['Drawer Organizers', 'Desktop Organizers', 'Bathroom Organizers', 'Wardrobe Organizers'] },
      { name: 'Hooks', subcategories: ['Wall Hooks', 'Adhesive Hooks', 'Decorative Hooks', 'Utility Hooks'] },
      { name: 'Racks', subcategories: ['Wall Racks', 'Kitchen Racks', 'Bathroom Racks', 'Shoe Racks'] },
    ],
  },
  {
    department: 'Pooja & Religious Items',
    categories: [
      { name: 'Pooja Decor', subcategories: ['Pooja Backdrops', 'Temple Decor', 'Aasan', 'Festive Pooja Decor'] },
      { name: 'Mandir Accessories', subcategories: ['Bell', 'Diyas', 'Incense Holders', 'Pooja Thali', 'Chowki'] },
      { name: 'Religious Cutouts', subcategories: ['MDF Religious Cutouts', 'Lakshmi Cutouts', 'Ganesh Cutouts', 'Hanuman Cutouts', 'Krishna Cutouts'] },
    ],
  },
  {
    department: 'Car Accessories',
    categories: [
      { name: 'Dashboard Decor', subcategories: ['Dashboard Idols', 'Dashboard Frames', 'Dashboard Lights', 'Dashboard Organizers'] },
      { name: 'Car Hanging', subcategories: ['Rearview Mirror Hangings', 'Religious Car Hanging', 'Decorative Car Hanging'] },
      { name: 'Car Organizers', subcategories: ['Seat Organizers', 'Boot Organizers', 'Trash Organizers', 'Car Storage Boxes'] },
    ],
  },
  {
    department: 'Garden & Outdoor',
    categories: [
      { name: 'Planters', subcategories: ['Table Planters', 'Hanging Planters', 'Wall Planters', 'Metal Planters', 'MDF Planters'] },
      { name: 'Garden Decor', subcategories: ['Garden Figures', 'Garden Signs', 'Garden Lights', 'Garden Stakes'] },
      { name: 'Outdoor Accessories', subcategories: ['Outdoor Mats', 'Outdoor Storage', 'Picnic Accessories', 'Outdoor Tools'] },
    ],
  },
  {
    department: 'Lighting & Lamps',
    categories: [
      { name: 'LED Lights', subcategories: ['LED String Lights', 'LED Strip Lights', 'LED Bulbs', 'Emergency Lights'] },
      { name: 'Decorative Lamps', subcategories: ['Table Lamps', 'Floor Lamps', 'Hanging Lamps', 'Wall Lamps'] },
      { name: 'Night Lamps', subcategories: ['Kids Night Lamps', 'LED Night Lamps', 'Sensor Night Lamps'] },
    ],
  },
  {
    department: 'Fashion & Accessories',
    categories: [
      { name: 'Bags', subcategories: ['Handbags', 'Backpacks', 'Tote Bags', 'Clutches', 'Shoulder Bags'] },
      { name: 'Watches', subcategories: ['Women Watches', 'Men Watches', 'Kids Watches', 'Smart Watches'] },
      { name: 'Jewellery', subcategories: ['Earrings', 'Necklaces', 'Bangles', 'Rings', 'Jewellery Sets'] },
      { name: 'Wallets', subcategories: ['Men Wallets', 'Women Wallets', 'Card Holders', 'Coin Purses'] },
    ],
  },
  {
    department: 'Beauty & Personal Care',
    categories: [
      { name: 'Grooming', subcategories: ['Hair Grooming', 'Beard Grooming', 'Skin Grooming', 'Nail Grooming'] },
      { name: 'Beauty Tools', subcategories: ['Makeup Brushes', 'Makeup Mirrors', 'Hair Tools', 'Manicure Tools'] },
      { name: 'Personal Care', subcategories: ['Skin Care', 'Hair Care', 'Bath Accessories', 'Personal Hygiene'] },
    ],
  },
  {
    department: 'Electronics',
    categories: [
      { name: 'Mobile Accessories', subcategories: ['Mobile Covers', 'Screen Guards', 'Phone Stands', 'Mobile Cables'] },
      { name: 'Chargers', subcategories: ['Wall Chargers', 'Car Chargers', 'Wireless Chargers', 'Power Banks'] },
      { name: 'Gadgets', subcategories: ['Bluetooth Devices', 'Smart Gadgets', 'Utility Electronics', 'Computer Accessories'] },
    ],
  },
  {
    department: 'Toys & Games',
    categories: [
      { name: 'Kids Toys', subcategories: ['Soft Toys', 'Action Toys', 'Learning Toys', 'Creative Toys'] },
      { name: 'Educational Toys', subcategories: ['Puzzle Toys', 'Alphabet Toys', 'Number Toys', 'STEM Toys'] },
      { name: 'Outdoor Games', subcategories: ['Ball Games', 'Active Play', 'Garden Games', 'Sports Toys'] },
    ],
  },
  {
    department: 'Gifts & Occasions',
    categories: [
      { name: 'Birthday Gifts', subcategories: ['Birthday Decor', 'Birthday Gift Sets', 'Personalized Birthday Gifts'] },
      { name: 'Festival Gifts', subcategories: ['Diwali Gifts', 'Raksha Bandhan Gifts', 'Christmas Gifts', 'Holi Gifts'] },
      { name: 'Home Gifts', subcategories: ['Housewarming Gifts', 'Wedding Gifts', 'Anniversary Gifts', 'Thank You Gifts'] },
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
