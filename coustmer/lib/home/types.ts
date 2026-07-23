/**
 * Home discovery contract — match this shape when you build the backend.
 *
 * Suggested endpoints (any one is enough):
 *   GET /api/v1/customer-service/discovery/home?city=Gwalior
 *   GET /api/v1/customer-service/customers/home/discovery?city=Gwalior
 *
 * Response envelope:
 * {
 *   success: true,
 *   data: {
 *     newlyAdded: HomeRestaurantCard[],
 *     trendingDishes: HomeTrendingDish[],
 *     categories: HomeCategory[]
 *   }
 * }
 */

export type HomeRestaurantCard = {
  id: string;
  name: string;
  imageUrl?: string;
  coverUrl?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
  cuisines?: string[];
  deliveryTime?: string;
  priceForTwo?: number;
  city?: string;
  address?: string;
  isNew?: boolean;
  badge?: string;
};

export type HomeTrendingDish = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  isVeg?: boolean;
  rating?: number;
  restaurantId: string;
  restaurantName: string;
  restaurantImageUrl?: string;
  badge?: string;
};

export type HomeCategory = {
  id: string;
  label: string;
  slug: string;
  imageUrl: string;
  color?: string;
  sortOrder?: number;
};

export type HomeDiscovery = {
  newlyAdded: HomeRestaurantCard[];
  trendingDishes: HomeTrendingDish[];
  categories: HomeCategory[];
  /** true when dummy placeholders are shown because the discovery API is not ready */
  isDummy: boolean;
};
