import type { Product, Sale } from './models.js';

export const categories = ['Beverages', 'Pantry', 'Personal care', 'Household'];
export const regions = ['North', 'South', 'East', 'West'];
export const retailers = ['Market Square', 'Daily Basket', 'Fresh Collective'];
export const segments = ['Value seekers', 'Everyday families', 'Premium shoppers'];
export const products: Product[] = [
  {
    id: 'p01',
    name: 'Cold Brew Original',
    category: 'Beverages',
    price: 4.5,
    description: 'Smooth, ready-to-drink coffee in a recyclable 250 ml bottle.',
  },
  {
    id: 'p02',
    name: 'Sparkling Citrus',
    category: 'Beverages',
    price: 2.8,
    description: 'Lightly sparkling citrus water, 330 ml.',
  },
  {
    id: 'p03',
    name: 'Oat Drink Barista',
    category: 'Beverages',
    price: 3.9,
    description: 'Creamy plant-based oat drink, one litre.',
  },
  {
    id: 'p04',
    name: 'Green Tea Blend',
    category: 'Beverages',
    price: 5.2,
    description: 'A balanced blend of loose-leaf green tea.',
  },
  {
    id: 'p05',
    name: 'Harvest Granola',
    category: 'Pantry',
    price: 6.4,
    description: 'Toasted oats, seeds and dried fruit, 400 g.',
  },
  {
    id: 'p06',
    name: 'Almond Butter',
    category: 'Pantry',
    price: 8.5,
    description: 'Roasted almond spread with no added sugar, 250 g.',
  },
  {
    id: 'p07',
    name: 'Wholegrain Pasta',
    category: 'Pantry',
    price: 3.2,
    description: 'Wholegrain durum wheat pasta, 500 g.',
  },
  {
    id: 'p08',
    name: 'Extra Virgin Olive Oil',
    category: 'Pantry',
    price: 12.9,
    description: 'Cold-extracted olive oil, 500 ml.',
  },
  {
    id: 'p09',
    name: 'Botanical Hand Wash',
    category: 'Personal care',
    price: 5.8,
    description: 'A gentle botanical hand wash, 300 ml.',
  },
  {
    id: 'p10',
    name: 'Daily Mineral SPF',
    category: 'Personal care',
    price: 14.5,
    description: 'Fictional daily mineral sunscreen, 50 ml.',
  },
  {
    id: 'p11',
    name: 'Gentle Shampoo',
    category: 'Personal care',
    price: 7.5,
    description: 'Everyday shampoo, 350 ml.',
  },
  {
    id: 'p12',
    name: 'Cotton Care Lotion',
    category: 'Personal care',
    price: 9.2,
    description: 'Lightweight body lotion, 250 ml.',
  },
  {
    id: 'p13',
    name: 'Plant-Based Dish Soap',
    category: 'Household',
    price: 4.2,
    description: 'Concentrated dish soap, 500 ml.',
  },
  {
    id: 'p14',
    name: 'Laundry Sheets',
    category: 'Household',
    price: 10.5,
    description: 'Compact laundry detergent sheets, 30 loads.',
  },
  {
    id: 'p15',
    name: 'Kitchen Surface Spray',
    category: 'Household',
    price: 4.8,
    description: 'Everyday kitchen cleaning spray, 500 ml.',
  },
  {
    id: 'p16',
    name: 'Recycled Paper Towels',
    category: 'Household',
    price: 6.1,
    description: 'Recycled paper towels, four-pack.',
  },
];
export const dataRange = { startDate: '2024-01-01', endDate: '2025-12-31' };
export const defaultRange = { startDate: '2025-07-01', endDate: '2025-12-31' };

// Seeded PRNG makes tests, screenshots and metric explanations reproducible.
let seed = 7429;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
export const sales: Sale[] = [];
for (
  let timestamp = Date.parse(dataRange.startDate);
  timestamp <= Date.parse(dataRange.endDate);
  timestamp += 86400000
) {
  const date = new Date(timestamp).toISOString().slice(0, 10);
  const month = new Date(timestamp).getUTCMonth();
  const yearFactor = date.startsWith('2025') ? 1.12 : 1;
  for (const [index, product] of products.entries()) {
    for (let channel = 0; channel < 2; channel++) {
      const region = regions[(index + channel + Math.floor(random() * 4)) % regions.length];
      const unitsSold = Math.max(
        1,
        Math.round(
          (3 + random() * 16) * yearFactor * (1 + 0.18 * Math.sin((month / 12) * Math.PI * 2)),
        ),
      );
      const revenue = Math.round(unitsSold * product.price * (0.93 + random() * 0.07) * 100) / 100;
      const id = String(sales.length + 1);
      sales.push({
        id,
        orderId: 'order-' + id,
        productId: product.id,
        productName: product.name,
        category: product.category,
        retailer: retailers[Math.floor(random() * retailers.length)],
        region,
        customerSegment: segments[Math.floor(random() * segments.length)],
        date,
        unitsSold,
        revenue,
      });
    }
  }
}
