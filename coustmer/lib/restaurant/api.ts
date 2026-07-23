import axios from 'axios';

import { api } from '@/lib/api';
import {
  mapCategory,
  mapMenuItem,
  mapOffer,
  mapRestaurant,
  normalizeMenu,
  toList,
} from '@/lib/restaurant/mappers';
import type {
  MenuItem,
  NearbyParams,
  PaginationMeta,
  Restaurant,
  RestaurantListParams,
  RestaurantMenu,
  RestaurantOffer,
  TrendingDish,
} from '@/lib/restaurant/types';
import { firstImageFromList, resolveMediaUrl } from '@/lib/restaurant/media';
import { getMenuItemRating } from '@/lib/restaurant/menu-rating';

const RESTAURANT_BASE = '/api/v1/restaurant-service/restaurants';

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
};

async function request<T>(path: string): Promise<Envelope<T>> {
  try {
    const response = await api.get<Envelope<T>>(path, { withCredentials: true });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error(
          'Network request failed. Check your internet connection and try again.'
        );
      }

      const data = error.response.data as { message?: string; error?: string } | undefined;
      throw new Error(
        data?.message || data?.error || `Request failed (${error.response.status})`
      );
    }
    throw error;
  }
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function extractRestaurantList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }
  if (!data || typeof data !== 'object') return [];

  const record = data as Record<string, unknown>;
  const nested =
    record.restaurants ??
    record.items ??
    record.results ??
    record.docs ??
    [];

  return Array.isArray(nested) ? (nested as Record<string, unknown>[]) : [];
}

export const restaurantApi = {
  /** GET /restaurants */
  getRestaurants: async (
    params: RestaurantListParams = {}
  ): Promise<{ restaurants: Restaurant[]; meta?: PaginationMeta }> => {
    const res = await request<unknown>(
      `${RESTAURANT_BASE}${buildQuery({
        page: params.page,
        limit: params.limit ?? 50,
        search: params.search,
        cuisine: params.cuisine,
        city: params.city,
        sort: params.sort ?? '-createdAt',
      })}`
    );
    return {
      restaurants: extractRestaurantList(res.data).map(mapRestaurant),
      meta: res.meta,
    };
  },

  /** Fetches all pages — ensures newly added restaurants are not cut off. */
  getAllRestaurants: async (
    params: Omit<RestaurantListParams, 'page' | 'fetchAll'> = {}
  ): Promise<{ restaurants: Restaurant[]; meta?: PaginationMeta }> => {
    const pageSize = params.limit ?? 50;
    const all: Restaurant[] = [];
    let page = 1;
    let lastMeta: PaginationMeta | undefined;
    let hasNext = true;

    while (hasNext && page <= 20) {
      const batch = await restaurantApi.getRestaurants({
        ...params,
        page,
        limit: pageSize,
        sort: params.sort ?? '-createdAt',
      });
      all.push(...batch.restaurants);
      lastMeta = batch.meta;
      hasNext = batch.meta?.hasNext ?? batch.restaurants.length >= pageSize;
      if (batch.restaurants.length === 0) break;
      page += 1;
    }

    return {
      restaurants: all,
      meta: lastMeta
        ? {
            ...lastMeta,
            total: lastMeta.total ?? all.length,
            page: 1,
            limit: all.length,
            hasNext: false,
          }
        : undefined,
    };
  },

  /** GET /restaurants/nearby */
  getNearby: async (
    params: NearbyParams
  ): Promise<{ restaurants: Restaurant[]; meta?: PaginationMeta }> => {
    const res = await request<unknown>(
      `${RESTAURANT_BASE}/nearby${buildQuery({
        lat: params.lat,
        lng: params.lng,
        radius: params.radius ?? 20,
        page: params.page,
        limit: params.limit ?? 50,
      })}`
    );
    return {
      restaurants: extractRestaurantList(res.data).map(mapRestaurant),
      meta: res.meta,
    };
  },

  /** GET /restaurants/:restaurantId */
  getRestaurant: async (restaurantId: string): Promise<Restaurant> => {
    const res = await request<Record<string, unknown>>(
      `${RESTAURANT_BASE}/${restaurantId}`
    );
    return mapRestaurant(res.data ?? {});
  },

  /** GET /restaurants/:restaurantId/menu */
  getMenu: async (restaurantId: string): Promise<RestaurantMenu> => {
    const res = await request<unknown>(`${RESTAURANT_BASE}/${restaurantId}/menu`);
    return normalizeMenu(res.data);
  },

  /** GET /restaurants/:restaurantId/categories */
  getCategories: async (restaurantId: string) => {
    const res = await request<Record<string, unknown>[]>(
      `${RESTAURANT_BASE}/${restaurantId}/categories`
    );
    return toList(res.data, mapCategory);
  },

  /** GET /restaurants/:restaurantId/items */
  getItems: async (restaurantId: string): Promise<MenuItem[]> => {
    const res = await request<Record<string, unknown>[]>(
      `${RESTAURANT_BASE}/${restaurantId}/items`
    );
    return toList(res.data, mapMenuItem);
  },

  /** GET /restaurants/:restaurantId/items/:itemId */
  getItem: async (restaurantId: string, itemId: string): Promise<MenuItem> => {
    const res = await request<Record<string, unknown>>(
      `${RESTAURANT_BASE}/${restaurantId}/items/${itemId}`
    );
    return mapMenuItem(res.data ?? {});
  },

  /** GET /restaurants/:restaurantId/offers */
  getOffers: async (restaurantId: string): Promise<RestaurantOffer[]> => {
    const res = await request<Record<string, unknown>[]>(
      `${RESTAURANT_BASE}/${restaurantId}/offers`
    );
    return toList(res.data, mapOffer);
  },

  /** GET /restaurants/:restaurantId/offers/:offerId */
  getOffer: async (
    restaurantId: string,
    offerId: string
  ): Promise<RestaurantOffer> => {
    const res = await request<Record<string, unknown>>(
      `${RESTAURANT_BASE}/${restaurantId}/offers/${offerId}`
    );
    return mapOffer(res.data ?? {});
  },

  /** Newest partners in a city — horizontal “Newly added” rail. */
  getNewlyAdded: async (params: {
    city?: string;
    limit?: number;
  } = {}): Promise<Restaurant[]> => {
    const { restaurants } = await restaurantApi.getRestaurants({
      city: params.city,
      limit: params.limit ?? 12,
      sort: '-createdAt',
      page: 1,
    });
    return restaurants;
  },

  /**
   * Trending dishes for home: pulls live menu items from city restaurants
   * and ranks by API rating + image availability.
   */
  getTrendingDishes: async (params: {
    city?: string;
    restaurantLimit?: number;
    dishLimit?: number;
  } = {}): Promise<TrendingDish[]> => {
    const restaurantLimit = params.restaurantLimit ?? 8;
    const dishLimit = params.dishLimit ?? 16;

    const { restaurants } = await restaurantApi.getRestaurants({
      city: params.city,
      limit: restaurantLimit,
      sort: '-createdAt',
      page: 1,
    });

    if (!restaurants.length) return [];

    const batches = await Promise.all(
      restaurants.map(async (restaurant) => {
        try {
          const res = await request<unknown>(
            `${RESTAURANT_BASE}/${restaurant.id}/items`
          );
          const rawList = Array.isArray(res.data)
            ? (res.data as Record<string, unknown>[])
            : (() => {
                if (!res.data || typeof res.data !== 'object') return [];
                const record = res.data as Record<string, unknown>;
                const nested =
                  record.items ??
                  record.menuItems ??
                  record.results ??
                  record.docs;
                return Array.isArray(nested)
                  ? (nested as Record<string, unknown>[])
                  : [];
              })();

          type RankedDish = TrendingDish & { hasApiImage?: boolean };
          const dishes: RankedDish[] = [];
          for (const raw of rawList) {
            const apiImage =
              resolveMediaUrl(
                (raw.imageUrl as string) ||
                  (raw.image as string) ||
                  firstImageFromList(raw.images)
              ) || undefined;
            const item = mapMenuItem(raw);
            if (!item.name || item.name === 'Item' || item.price <= 0) continue;
            if (item.isAvailable === false) continue;

            dishes.push({
              id: item.id,
              name: item.name,
              price: item.price,
              imageUrl: apiImage || item.imageUrl,
              isVeg: item.isVeg,
              rating: getMenuItemRating(item) ?? item.rating,
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              restaurantImageUrl:
                restaurant.coverUrl || restaurant.imageUrl || restaurant.logoUrl,
              hasApiImage: Boolean(apiImage),
            });
          }
          return dishes;
        } catch {
          return [] as Array<TrendingDish & { hasApiImage?: boolean }>;
        }
      })
    );

    const flat = batches.flat();

    // Spread across restaurants: take up to 2 best dishes per place, then fill.
    const byRestaurant = new Map<string, typeof flat>();
    for (const dish of flat) {
      const list = byRestaurant.get(dish.restaurantId) ?? [];
      list.push(dish);
      byRestaurant.set(dish.restaurantId, list);
    }

    const picked: typeof flat = [];
    for (const list of byRestaurant.values()) {
      list.sort((a, b) => {
        const img = Number(Boolean(b.hasApiImage)) - Number(Boolean(a.hasApiImage));
        if (img) return img;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
      picked.push(...list.slice(0, 2));
    }

    picked.sort((a, b) => {
      const img = Number(Boolean(b.hasApiImage)) - Number(Boolean(a.hasApiImage));
      if (img) return img;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    return picked.slice(0, dishLimit).map((dish) => ({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      imageUrl: dish.imageUrl,
      isVeg: dish.isVeg,
      rating: dish.rating,
      restaurantId: dish.restaurantId,
      restaurantName: dish.restaurantName,
      restaurantImageUrl: dish.restaurantImageUrl,
    }));
  },
};
