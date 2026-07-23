export type RestaurantAddress = {
  street: string;
  area?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export type RestaurantLocation = {
  type: 'Point';
  /** [lng, lat] */
  coordinates: [number, number];
};

export type CreateRestaurantPayload = {
  name: string;
  description?: string;
  fssaiLicense?: string;
  gstin?: string;
  priceRange?: 'budget' | 'moderate' | 'expensive' | 'fine_dining' | string;
  costForTwo?: number;
  address: RestaurantAddress;
  location: RestaurantLocation;
};

export type RestaurantOwnerRestaurant = {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  status?: string;
  [key: string]: unknown;
};

export type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
};

