import type {
  MenuCategory,
  MenuItem,
  Restaurant,
  RestaurantMenu,
  RestaurantOffer,
} from '@/lib/restaurant/types';

export function mapRestaurant(data: Record<string, unknown>): Restaurant {
  const cuisines = data.cuisines ?? data.cuisineTypes ?? data.tags;
  return {
    id: String(data._id ?? data.id ?? ''),
    name: String(data.name ?? data.restaurantName ?? 'Restaurant'),
    description: (data.description as string) || undefined,
    imageUrl:
      (data.imageUrl as string) ||
      (data.coverImage as string) ||
      (data.coverUrl as string) ||
      undefined,
    coverUrl: (data.coverUrl as string) || (data.coverImage as string) || undefined,
    logoUrl: (data.logoUrl as string) || (data.logo as string) || undefined,
    rating: typeof data.rating === 'number' ? data.rating : Number(data.rating) || undefined,
    reviewCount:
      typeof data.reviewCount === 'number'
        ? data.reviewCount
        : Number(data.totalReviews ?? data.reviews) || undefined,
    cuisines: Array.isArray(cuisines) ? (cuisines as string[]) : undefined,
    deliveryTime:
      (data.deliveryTime as string) ||
      (data.avgDeliveryTime as string) ||
      undefined,
    priceForTwo:
      typeof data.priceForTwo === 'number'
        ? data.priceForTwo
        : Number(data.costForTwo ?? data.priceForTwo) || undefined,
    costForTwo:
      typeof data.costForTwo === 'number'
        ? data.costForTwo
        : Number(data.priceForTwo) || undefined,
    distance:
      typeof data.distance === 'number' ? data.distance : Number(data.distanceKm) || undefined,
    isOpen: data.isOpen !== undefined ? Boolean(data.isOpen) : undefined,
    address: (data.address as string) || undefined,
    city: (data.city as string) || undefined,
    offer: (data.offer as string) || (data.promoText as string) || undefined,
  };
}

export function mapCategory(data: Record<string, unknown>): MenuCategory {
  return {
    id: String(data._id ?? data.id ?? data.name ?? ''),
    name: String(data.name ?? data.title ?? 'Category'),
    description: (data.description as string) || undefined,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : undefined,
    itemCount: typeof data.itemCount === 'number' ? data.itemCount : undefined,
  };
}

export function mapMenuItem(data: Record<string, unknown>): MenuItem {
  return {
    id: String(data._id ?? data.id ?? ''),
    name: String(data.name ?? data.title ?? 'Item'),
    description: (data.description as string) || undefined,
    price: Number(data.price ?? data.basePrice ?? 0),
    imageUrl: (data.imageUrl as string) || (data.image as string) || undefined,
    categoryId: String(data.categoryId ?? data.category ?? '') || undefined,
    categoryName: (data.categoryName as string) || undefined,
    isVeg: data.isVeg !== undefined ? Boolean(data.isVeg) : undefined,
    isAvailable:
      data.isAvailable !== undefined ? Boolean(data.isAvailable) : true,
    rating: typeof data.rating === 'number' ? data.rating : undefined,
  };
}

export function mapOffer(data: Record<string, unknown>): RestaurantOffer {
  return {
    id: String(data._id ?? data.id ?? ''),
    title: String(data.title ?? data.name ?? 'Offer'),
    description: (data.description as string) || undefined,
    code: (data.code as string) || (data.couponCode as string) || undefined,
    discountType: (data.discountType as string) || undefined,
    discountValue:
      typeof data.discountValue === 'number'
        ? data.discountValue
        : Number(data.discount) || undefined,
    minOrderAmount:
      typeof data.minOrderAmount === 'number'
        ? data.minOrderAmount
        : Number(data.minOrder) || undefined,
    validUntil: (data.validUntil as string) || (data.expiresAt as string) || undefined,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
  };
}

export function normalizeMenu(data: unknown): RestaurantMenu {
  if (!data || typeof data !== 'object') {
    return { categories: [], items: [] };
  }

  const payload = data as Record<string, unknown>;

  if (Array.isArray(payload.categories) || Array.isArray(payload.items)) {
    return {
      categories: Array.isArray(payload.categories)
        ? payload.categories.map((c) => mapCategory(c as Record<string, unknown>))
        : [],
      items: Array.isArray(payload.items)
        ? payload.items.map((i) => mapMenuItem(i as Record<string, unknown>))
        : [],
    };
  }

  if (Array.isArray(data)) {
    return {
      categories: [],
      items: data.map((i) => mapMenuItem(i as Record<string, unknown>)),
    };
  }

  return { categories: [], items: [] };
}

export function toList<T>(
  data: unknown,
  mapper: (row: Record<string, unknown>) => T
): T[] {
  if (Array.isArray(data)) {
    return data.map((row) => mapper(row as Record<string, unknown>));
  }
  return [];
}
