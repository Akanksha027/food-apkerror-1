import type { LucideIcon } from 'lucide-react-native';
import {
  Beef,
  CakeSlice,
  Coffee,
  Cookie,
  Croissant,
  Drumstick,
  EggFried,
  Fish,
  GlassWater,
  IceCream,
  Nut,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react-native';

export type FoodCategory = {
  label: string;
  slug: string;
  icon: LucideIcon;
  color: string;
  /** Real food photo for category chips */
  imageUrl: string;
};

/** Slugs are sent to GET /restaurants?cuisine=... */
export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    label: 'All',
    slug: 'all',
    icon: UtensilsCrossed,
    color: '#FF5A41',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Pizza',
    slug: 'pizza',
    icon: Pizza,
    color: '#E8590C',
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Biryani',
    slug: 'biryani',
    icon: Drumstick,
    color: '#C4520A',
    imageUrl:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Burgers',
    slug: 'burger',
    icon: Sandwich,
    color: '#D97706',
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Cake',
    slug: 'dessert',
    icon: CakeSlice,
    color: '#DB2777',
    imageUrl:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'North Indian',
    slug: 'north-indian',
    icon: Soup,
    color: '#B45309',
    imageUrl:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Chinese',
    slug: 'chinese',
    icon: Soup,
    color: '#DC2626',
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'South Indian',
    slug: 'south-indian',
    icon: Cookie,
    color: '#CA8A04',
    imageUrl:
      'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Rolls',
    slug: 'rolls',
    icon: Wheat,
    color: '#EA580C',
    imageUrl:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Momos',
    slug: 'momos',
    icon: Cookie,
    color: '#C2410C',
    imageUrl:
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Shawarma',
    slug: 'shawarma',
    icon: Beef,
    color: '#9A3412',
    imageUrl:
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Thali',
    slug: 'thali',
    icon: UtensilsCrossed,
    color: '#A16207',
    imageUrl:
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Pasta',
    slug: 'pasta',
    icon: Wheat,
    color: '#D97706',
    imageUrl:
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Noodles',
    slug: 'noodles',
    icon: Soup,
    color: '#EA580C',
    imageUrl:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Kebab',
    slug: 'kebab',
    icon: Drumstick,
    color: '#E8482F',
    imageUrl:
      'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Chicken',
    slug: 'chicken',
    icon: Drumstick,
    color: '#C2410C',
    imageUrl:
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Seafood',
    slug: 'seafood',
    icon: Fish,
    color: '#0891B2',
    imageUrl:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Veg Meal',
    slug: 'healthy',
    icon: Salad,
    color: '#16A34A',
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Salad',
    slug: 'salad',
    icon: Salad,
    color: '#15803D',
    imageUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Breakfast',
    slug: 'breakfast',
    icon: EggFried,
    color: '#CA8A04',
    imageUrl:
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Sandwich',
    slug: 'sandwich',
    icon: Sandwich,
    color: '#D97706',
    imageUrl:
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Coffee',
    slug: 'coffee',
    icon: Coffee,
    color: '#7C4A21',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Juice',
    slug: 'juice',
    icon: GlassWater,
    color: '#F59E0B',
    imageUrl:
      'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Chaat',
    slug: 'chaat',
    icon: Nut,
    color: '#EA580C',
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Bakery',
    slug: 'bakery',
    icon: Croissant,
    color: '#B45309',
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Ice Cream',
    slug: 'ice-cream',
    icon: IceCream,
    color: '#7C3AED',
    imageUrl:
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Soups',
    slug: 'soup',
    icon: Soup,
    color: '#CA8A04',
    imageUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=300&fit=crop&q=80',
  },
  {
    label: 'Sweets',
    slug: 'sweets',
    icon: Cookie,
    color: '#DB2777',
    imageUrl:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&h=300&fit=crop&q=80',
  },
];

/** How many categories show in the collapsed strip (excluding the More tile). */
export const CATEGORY_COLLAPSED_COUNT = 7;

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
  if (!slug || slug === 'all') return true;

  const category = findCategoryBySlug(slug);
  if (!category) return false;

  const needle = category.slug.toLowerCase().replace(/-/g, ' ');
  const label = category.label.toLowerCase();

  if (
    restaurant.cuisines?.some((c) => {
      const cLower = c.toLowerCase();
      return (
        cLower.includes(needle) ||
        cLower.includes(label) ||
        label.includes(cLower) ||
        cLower.includes(category.slug.toLowerCase())
      );
    })
  ) {
    return true;
  }

  return (restaurant.name ?? '').toLowerCase().includes(needle);
}

/** Match a restaurant menu category (from GET .../categories) to a home cuisine slug. */
export function menuCategoryMatchesCuisine(
  menuCategory: { id?: string; name?: string },
  cuisineSlug: string
): boolean {
  if (!cuisineSlug || cuisineSlug === 'all') return true;
  const food = findCategoryBySlug(cuisineSlug);
  if (!food) return false;

  const name = String(menuCategory.name ?? '').toLowerCase().trim();
  if (!name) return false;

  const slug = food.slug.toLowerCase();
  const slugWords = slug.replace(/-/g, ' ');
  const label = food.label.toLowerCase();

  return (
    name === label ||
    name === slugWords ||
    name.includes(label) ||
    name.includes(slugWords) ||
    label.includes(name) ||
    name.includes(slug.replace(/-/g, ''))
  );
}

/** Pick the best menu category id for a cuisine filter, or null. */
export function resolveMenuCategoryId(
  menuCategories: { id: string; name: string }[],
  cuisineSlug?: string | null
): string | null {
  if (!cuisineSlug || cuisineSlug === 'all' || !menuCategories.length) {
    return null;
  }
  const match = menuCategories.find((c) =>
    menuCategoryMatchesCuisine(c, cuisineSlug)
  );
  return match?.id ?? null;
}
