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
} from '@/lib/restaurant/types';

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

export const restaurantApi = {
  /** GET /restaurants */
  getRestaurants: async (
    params: RestaurantListParams = {}
  ): Promise<{ restaurants: Restaurant[]; meta?: PaginationMeta }> => {
    const res = await request<Record<string, unknown>[]>(
      `${RESTAURANT_BASE}${buildQuery({
        page: params.page,
        limit: params.limit ?? 20,
        search: params.search,
        cuisine: params.cuisine,
        sort: params.sort,
      })}`
    );
    return {
      restaurants: toList(res.data, mapRestaurant),
      meta: res.meta,
    };
  },

  /** GET /restaurants/nearby */
  getNearby: async (
    params: NearbyParams
  ): Promise<{ restaurants: Restaurant[]; meta?: PaginationMeta }> => {
    const res = await request<Record<string, unknown>[]>(
      `${RESTAURANT_BASE}/nearby${buildQuery({
        lat: params.lat,
        lng: params.lng,
        radius: params.radius,
        page: params.page,
        limit: params.limit ?? 20,
      })}`
    );
    return {
      restaurants: toList(res.data, mapRestaurant),
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
};
