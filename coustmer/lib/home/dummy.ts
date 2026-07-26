import type {
  HomeCategory,
  HomeDiscovery,
  HomeRestaurantCard,
  HomeTrendingDish,
} from '@/lib/home/types';

/**
 * Polished placeholder content for home rails.
 * Replaced automatically when discovery API returns real data.
 */
export const DUMMY_CATEGORIES: HomeCategory[] = [
  {
    id: 'cat-all',
    label: 'All',
    slug: 'all',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop&q=80',
    color: '#FF5A41',
    sortOrder: 0,
  },
  {
    id: 'cat-pizza',
    label: 'Pizza',
    slug: 'pizza',
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop&q=80',
    color: '#E8590C',
    sortOrder: 1,
  },
  {
    id: 'cat-biryani',
    label: 'Biryani',
    slug: 'biryani',
    imageUrl:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=300&fit=crop&q=80',
    color: '#C4520A',
    sortOrder: 2,
  },
  {
    id: 'cat-burger',
    label: 'Burgers',
    slug: 'burger',
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop&q=80',
    color: '#D97706',
    sortOrder: 3,
  },
  {
    id: 'cat-north',
    label: 'North Indian',
    slug: 'north-indian',
    imageUrl:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=300&fit=crop&q=80',
    color: '#B45309',
    sortOrder: 4,
  },
  {
    id: 'cat-chinese',
    label: 'Chinese',
    slug: 'chinese',
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300&h=300&fit=crop&q=80',
    color: '#DC2626',
    sortOrder: 5,
  },
  {
    id: 'cat-dessert',
    label: 'Desserts',
    slug: 'dessert',
    imageUrl:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop&q=80',
    color: '#DB2777',
    sortOrder: 6,
  },
  {
    id: 'cat-cafe',
    label: 'Cafe',
    slug: 'cafe',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop&q=80',
    color: '#92400E',
    sortOrder: 7,
  },
  {
    id: 'cat-rolls',
    label: 'Rolls',
    slug: 'rolls',
    imageUrl:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=300&fit=crop&q=80',
    color: '#EA580C',
    sortOrder: 8,
  },
  {
    id: 'cat-momos',
    label: 'Momos',
    slug: 'momos',
    imageUrl:
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&h=300&fit=crop&q=80',
    color: '#C2410C',
    sortOrder: 9,
  },
  {
    id: 'cat-chaat',
    label: 'Chaat',
    slug: 'chaat',
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=300&fit=crop&q=80',
    color: '#EA580C',
    sortOrder: 10,
  },
  {
    id: 'cat-south',
    label: 'South Indian',
    slug: 'south-indian',
    imageUrl:
      'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=300&fit=crop&q=80',
    color: '#B45309',
    sortOrder: 11,
  },
];

export const DUMMY_NEWLY_ADDED: HomeRestaurantCard[] = [
  {
    id: 'dummy-rest-1',
    name: 'Spice Route Kitchen',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=450&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 128,
    cuisines: ['North Indian', 'Mughlai'],
    deliveryTime: '25–35 mins',
    priceForTwo: 499,
    isNew: true,
    badge: 'NEW',
  },
  {
    id: 'dummy-rest-2',
    name: 'Oven & Crust',
    imageUrl:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=450&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 86,
    cuisines: ['Pizza', 'Italian'],
    deliveryTime: '20–30 mins',
    priceForTwo: 599,
    isNew: true,
    badge: 'NEW',
  },
  {
    id: 'dummy-rest-3',
    name: 'Bowl & Broth',
    imageUrl:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=450&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 54,
    cuisines: ['Chinese', 'Asian'],
    deliveryTime: '30–40 mins',
    priceForTwo: 449,
    isNew: true,
    badge: 'NEW',
  },
  {
    id: 'dummy-rest-4',
    name: 'Sweet Theory',
    imageUrl:
      'https://images.unsplash.com/photo-1551024506-0bccd828d697?w=600&h=450&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 201,
    cuisines: ['Desserts', 'Bakery'],
    deliveryTime: '15–25 mins',
    priceForTwo: 349,
    isNew: true,
    badge: 'NEW',
  },
  {
    id: 'dummy-rest-5',
    name: 'Grill House Co.',
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 97,
    cuisines: ['Grill', 'BBQ'],
    deliveryTime: '28–38 mins',
    priceForTwo: 699,
    isNew: true,
    badge: 'NEW',
  },
  {
    id: 'dummy-rest-6',
    name: 'Cafe Lantern',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=450&fit=crop&q=80',
    rating: 4.2,
    reviewCount: 63,
    cuisines: ['Cafe', 'Beverages'],
    deliveryTime: '18–28 mins',
    priceForTwo: 399,
    isNew: true,
    badge: 'NEW',
  },
];

export const DUMMY_TRENDING_DISHES: HomeTrendingDish[] = [
  {
    id: 'dummy-dish-1',
    name: 'Butter Chicken',
    price: 320,
    imageUrl:
      'https://images.unsplash.com/photo-1603894584372-a7369195528d?w=600&h=450&fit=crop&q=80',
    isVeg: false,
    rating: 4.6,
    restaurantId: 'dummy-rest-1',
    restaurantName: 'Spice Route Kitchen',
    badge: 'Bestseller',
  },
  {
    id: 'dummy-dish-2',
    name: 'Margherita Pizza',
    price: 249,
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop&q=80',
    isVeg: true,
    rating: 4.5,
    restaurantId: 'dummy-rest-2',
    restaurantName: 'Oven & Crust',
    badge: 'Popular',
  },
  {
    id: 'dummy-dish-3',
    name: 'Chicken Hakka Noodles',
    price: 199,
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=450&fit=crop&q=80',
    isVeg: false,
    rating: 4.4,
    restaurantId: 'dummy-rest-3',
    restaurantName: 'Bowl & Broth',
    badge: 'Trending',
  },
  {
    id: 'dummy-dish-4',
    name: 'Chocolate Lava Cake',
    price: 149,
    imageUrl:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=450&fit=crop&q=80',
    isVeg: true,
    rating: 4.8,
    restaurantId: 'dummy-rest-4',
    restaurantName: 'Sweet Theory',
    badge: 'Must try',
  },
  {
    id: 'dummy-dish-5',
    name: 'Paneer Tikka',
    price: 260,
    imageUrl:
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=450&fit=crop&q=80',
    isVeg: true,
    rating: 4.3,
    restaurantId: 'dummy-rest-1',
    restaurantName: 'Spice Route Kitchen',
    badge: 'Chef special',
  },
  {
    id: 'dummy-dish-6',
    name: 'BBQ Chicken Wings',
    price: 289,
    imageUrl:
      'https://images.unsplash.com/photo-1527477396000-e2717f6f4c83?w=600&h=450&fit=crop&q=80',
    isVeg: false,
    rating: 4.5,
    restaurantId: 'dummy-rest-5',
    restaurantName: 'Grill House Co.',
    badge: 'Hot',
  },
  {
    id: 'dummy-dish-7',
    name: 'Cold Coffee',
    price: 129,
    imageUrl:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop&q=80',
    isVeg: true,
    rating: 4.2,
    restaurantId: 'dummy-rest-6',
    restaurantName: 'Cafe Lantern',
  },
  {
    id: 'dummy-dish-8',
    name: 'Veg Supreme Pizza',
    price: 329,
    imageUrl:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=450&fit=crop&q=80',
    isVeg: true,
    rating: 4.4,
    restaurantId: 'dummy-rest-2',
    restaurantName: 'Oven & Crust',
    badge: 'Popular',
  },
];

export function getDummyHomeDiscovery(): HomeDiscovery {
  return {
    newlyAdded: DUMMY_NEWLY_ADDED,
    trendingDishes: DUMMY_TRENDING_DISHES,
    categories: DUMMY_CATEGORIES,
    isDummy: true,
  };
}
