export type PaginationMeta = {
  total?: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasNext: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  coverUrl?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
  cuisines?: string[];
  deliveryTime?: string;
  priceForTwo?: number;
  costForTwo?: number;
  distance?: number;
  isOpen?: boolean;
  address?: string;
  city?: string;
  offer?: string;
  [key: string]: unknown;
};

export type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  itemCount?: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  rating?: number;
  [key: string]: unknown;
};

export type RestaurantMenu = {
  categories: MenuCategory[];
  items: MenuItem[];
};

export type RestaurantOffer = {
  id: string;
  title: string;
  description?: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  validUntil?: string;
  isActive?: boolean;
  [key: string]: unknown;
};

export type RestaurantListParams = {
  page?: number;
  limit?: number;
  search?: string;
  cuisine?: string;
  sort?: string;
};

export type NearbyParams = {
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  limit?: number;
};
