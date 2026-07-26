import { expandSearchQuery } from '@/lib/search/expandQuery';

/**
 * Search variety chips — change with the dish the user typed
 * (e.g. Pizza → Margherita, Onion, Corn…).
 * Styling (shared multicolor border + label) lives in the UI.
 */

export type SearchVariety = {
  id: string;
  label: string;
};

const VARIETY_MAP: Record<string, SearchVariety[]> = {
  pizza: [
    { id: 'margherita', label: 'Margherita' },
    { id: 'onion', label: 'Onion' },
    { id: 'corn', label: 'Corn' },
    { id: 'capsicum', label: 'Capsicum' },
    { id: 'tikka', label: 'Tikka' },
  ],
  burger: [
    { id: 'cheese', label: 'Cheese' },
    { id: 'chicken', label: 'Chicken' },
    { id: 'veg', label: 'Veg' },
    { id: 'double', label: 'Double' },
    { id: 'spicy', label: 'Spicy' },
  ],
  biryani: [
    { id: 'chicken', label: 'Chicken' },
    { id: 'mutton', label: 'Mutton' },
    { id: 'veg', label: 'Veg' },
    { id: 'hyderabadi', label: 'Hyderabadi' },
    { id: 'dum', label: 'Dum' },
  ],
  momos: [
    { id: 'steamed', label: 'Steamed' },
    { id: 'fried', label: 'Fried' },
    { id: 'tandoori', label: 'Tandoori' },
    { id: 'kurkure', label: 'Kurkure' },
    { id: 'paneer', label: 'Paneer' },
  ],
  pasta: [
    { id: 'white', label: 'White Sauce' },
    { id: 'red', label: 'Red Sauce' },
    { id: 'arrabiata', label: 'Arrabiata' },
    { id: 'pesto', label: 'Pesto' },
    { id: 'cheese', label: 'Cheese' },
  ],
  sandwich: [
    { id: 'grill', label: 'Grill' },
    { id: 'club', label: 'Club' },
    { id: 'veg', label: 'Veg' },
    { id: 'cheese', label: 'Cheese' },
    { id: 'paneer', label: 'Paneer' },
  ],
  noodles: [
    { id: 'hakka', label: 'Hakka' },
    { id: 'schezwan', label: 'Schezwan' },
    { id: 'garlic', label: 'Garlic' },
    { id: 'veg', label: 'Veg' },
    { id: 'chilli', label: 'Chilli' },
  ],
  thali: [
    { id: 'north', label: 'North Indian' },
    { id: 'south', label: 'South Indian' },
    { id: 'gujarati', label: 'Gujarati' },
    { id: 'rajasthani', label: 'Rajasthani' },
  ],
  ice: [
    { id: 'chocolate', label: 'Chocolate' },
    { id: 'vanilla', label: 'Vanilla' },
    { id: 'strawberry', label: 'Strawberry' },
    { id: 'butterscotch', label: 'Butterscotch' },
  ],
  cake: [
    { id: 'chocolate', label: 'Chocolate' },
    { id: 'butterscotch', label: 'Butterscotch' },
    { id: 'redvelvet', label: 'Red Velvet' },
    { id: 'blackforest', label: 'Black Forest' },
  ],
  sweets: [
    { id: 'gulab', label: 'Gulab Jamun' },
    { id: 'rasgulla', label: 'Rasgulla' },
    { id: 'jalebi', label: 'Jalebi' },
    { id: 'ladoo', label: 'Ladoo' },
  ],
  roll: [
    { id: 'egg', label: 'Egg' },
    { id: 'chicken', label: 'Chicken' },
    { id: 'paneer', label: 'Paneer' },
    { id: 'kathi', label: 'Kathi' },
  ],
  dosa: [
    { id: 'masala', label: 'Masala' },
    { id: 'plain', label: 'Plain' },
    { id: 'mysore', label: 'Mysore' },
    { id: 'cheese', label: 'Cheese' },
    { id: 'onion', label: 'Onion' },
  ],
  chicken: [
    { id: 'biryani', label: 'Biryani' },
    { id: 'tikka', label: 'Tikka' },
    { id: 'butter', label: 'Butter' },
    { id: 'fried', label: 'Fried' },
    { id: 'kebab', label: 'Kebab' },
  ],
};

const KEYS = Object.keys(VARIETY_MAP).sort((a, b) => b.length - a.length);

/** Resolve variety chips for the current search term. */
export function getVarietiesForQuery(query: string): SearchVariety[] {
  const q = expandSearchQuery(query).trim().toLowerCase();
  if (!q) return [];

  if (VARIETY_MAP[q]) return VARIETY_MAP[q];

  for (const key of KEYS) {
    if (q.includes(key) || key.includes(q)) return VARIETY_MAP[key];
  }

  if (q.includes('cream') || q.includes('icecream')) return VARIETY_MAP.ice;
  if (q.includes('sweet')) return VARIETY_MAP.sweets;

  const title = expandSearchQuery(query).trim() || query.trim();
  return [
    { id: 'classic', label: 'Classic' },
    { id: 'spicy', label: 'Spicy' },
    { id: 'cheese', label: 'Cheese' },
    { id: 'special', label: `${title} Special` },
  ];
}
