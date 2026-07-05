import type { LucideIcon } from 'lucide-react-native';
import {
  CakeSlice,
  Coffee,
  Drumstick,
  Fish,
  IceCream,
  Pizza,
  Salad,
  Sandwich,
  Soup,
} from 'lucide-react-native';

export type FoodCategory = {
  label: string;
  slug: string;
  icon: LucideIcon;
  color: string;
};

/** Slugs are sent to GET /restaurants?cuisine=... */
export const FOOD_CATEGORIES: FoodCategory[] = [
  { label: 'Pizza', slug: 'pizza', icon: Pizza, color: '#E8590C' },
  { label: 'Biryani', slug: 'biryani', icon: Drumstick, color: '#C4520A' },
  { label: 'Burgers', slug: 'burger', icon: Sandwich, color: '#D97706' },
  { label: 'Healthy', slug: 'healthy', icon: Salad, color: '#16A34A' },
  { label: 'Desserts', slug: 'dessert', icon: CakeSlice, color: '#DB2777' },
  { label: 'Coffee', slug: 'coffee', icon: Coffee, color: '#7C4A21' },
  { label: 'Seafood', slug: 'seafood', icon: Fish, color: '#0891B2' },
  { label: 'Soups', slug: 'soup', icon: Soup, color: '#CA8A04' },
  { label: 'Ice Cream', slug: 'ice-cream', icon: IceCream, color: '#7C3AED' },
];

export function findCategoryBySlug(slug?: string) {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase();
  return FOOD_CATEGORIES.find(
    (cat) =>
      cat.slug === normalized ||
      cat.label.toLowerCase() === normalized ||
      cat.label.toLowerCase().replace(/\s+/g, '-') === normalized
  );
}

export function restaurantMatchesCategory(
  restaurant: { cuisines?: string[]; name?: string },
  slug: string
) {
  const category = findCategoryBySlug(slug);
  if (!category) return false;

  const needle = category.slug.toLowerCase();
  const label = category.label.toLowerCase();

  if (restaurant.cuisines?.some((c) => {
    const cLower = c.toLowerCase();
    return cLower.includes(needle) || cLower.includes(label) || label.includes(cLower);
  })) {
    return true;
  }

  return (restaurant.name ?? '').toLowerCase().includes(needle);
}
