import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { restaurantApi } from '@/lib/restaurant/api';
import { queryClient } from '@/lib/query-client';
import {
  menuCategoryMatchesCuisine,
  restaurantMatchesCategory,
} from '@/lib/restaurant/categories';
import { enrichMenuItems } from '@/lib/restaurant/mappers';
import { buildSeedMenu, findSeedMenuItem } from '@/lib/restaurant/seed-menu';
import type {
  NearbyParams,
  Restaurant,
  RestaurantListParams,
} from '@/lib/restaurant/types';

export type SeedMenuOptions = {
  name?: string;
  cuisines?: string[];
};

export const restaurantKeys = {
  all: ['restaurant'] as const,
  list: (params: RestaurantListParams) =>
    [...restaurantKeys.all, 'list', params] as const,
  infinite: (params: Omit<RestaurantListParams, 'page' | 'fetchAll'>) =>
    [...restaurantKeys.all, 'infinite', params] as const,
  nearby: (params: NearbyParams) =>
    [...restaurantKeys.all, 'nearby', params] as const,
  detail: (id: string) => [...restaurantKeys.all, 'detail', id] as const,
  menu: (id: string) => [...restaurantKeys.all, 'menu', id] as const,
  categories: (id: string) => [...restaurantKeys.all, 'categories', id] as const,
  items: (id: string) => [...restaurantKeys.all, 'items', id] as const,
  item: (restaurantId: string, itemId: string) =>
    [...restaurantKeys.all, 'item', restaurantId, itemId] as const,
  offers: (id: string) => [...restaurantKeys.all, 'offers', id] as const,
  offer: (restaurantId: string, offerId: string) =>
    [...restaurantKeys.all, 'offer', restaurantId, offerId] as const,
};

export function useRestaurants(params: RestaurantListParams = {}) {
  const fetchAll = params.fetchAll !== false;

  return useQuery({
    queryKey: restaurantKeys.list({ ...params, fetchAll }),
    queryFn: () =>
      fetchAll
        ? restaurantApi.getAllRestaurants(params)
        : restaurantApi.getRestaurants(params),
    retry: 2,
    staleTime: 60_000,
  });
}

/** Paginated endless list — loads more as the user scrolls. */
export function useInfiniteRestaurants(
  params: Omit<RestaurantListParams, 'page' | 'fetchAll'> = {},
  options?: { enabled?: boolean }
) {
  const pageSize = params.limit ?? 12;

  return useInfiniteQuery({
    queryKey: restaurantKeys.infinite({ ...params, limit: pageSize }),
    queryFn: ({ pageParam }) =>
      restaurantApi.getRestaurants({
        ...params,
        page: pageParam,
        limit: pageSize,
        sort: params.sort ?? '-createdAt',
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.hasNext) {
        return (lastPage.meta.page ?? 1) + 1;
      }
      if (
        lastPage.restaurants.length >= pageSize &&
        (lastPage.meta?.totalPages == null ||
          (lastPage.meta.page ?? 1) < (lastPage.meta.totalPages ?? 1))
      ) {
        return (lastPage.meta?.page ?? 1) + 1;
      }
      return undefined;
    },
    retry: 2,
    staleTime: 60_000,
    enabled: options?.enabled !== false,
  });
}

export function useNearbyRestaurants(params: NearbyParams | null) {
  return useQuery({
    queryKey: restaurantKeys.nearby(params ?? { lat: 0, lng: 0 }),
    queryFn: () =>
      restaurantApi.getNearby({
        ...params!,
        limit: params?.limit ?? 50,
        radius: params?.radius ?? 20,
      }),
    enabled: Boolean(params?.lat && params?.lng),
    retry: 2,
    staleTime: 60_000,
  });
}

/**
 * Restaurants that offer a cuisine/category.
 * Uses list API (?cuisine=&city=) then confirms via GET .../categories when available.
 */
export function useRestaurantsOfferingCategory(input: {
  cuisine: string;
  city?: string | null;
  enabled?: boolean;
}) {
  const cuisine = input.cuisine.trim();
  const city = input.city?.trim() || undefined;

  return useQuery({
    queryKey: [
      ...restaurantKeys.all,
      'offering-category',
      cuisine,
      city ?? '',
    ],
    queryFn: async (): Promise<{ restaurants: Restaurant[]; total: number }> => {
      const { restaurants: listed, meta } = await restaurantApi.getRestaurants({
        cuisine,
        city,
        sort: '-createdAt',
        limit: 50,
        page: 1,
      });

      // Cuisine-filtered list from API; broaden with city matches when sparse.
      const listedIds = new Set(listed.map((r) => r.id));
      let candidates = [...listed];
      if (candidates.length < 8 && city) {
        const broader = await restaurantApi.getRestaurants({
          city,
          sort: '-createdAt',
          limit: 50,
          page: 1,
        });
        const merged = new Map<string, Restaurant>();
        for (const r of listed) merged.set(r.id, r);
        for (const r of broader.restaurants) {
          if (listedIds.has(r.id) || restaurantMatchesCategory(r, cuisine)) {
            merged.set(r.id, r);
          }
        }
        candidates = [...merged.values()];
      }

      if (candidates.length === 0) {
        return { restaurants: [], total: 0 };
      }

      const matched: Restaurant[] = [];
      const chunkSize = 8;

      for (let i = 0; i < candidates.length; i += chunkSize) {
        const chunk = candidates.slice(i, i + chunkSize);
        const rows = await Promise.all(
          chunk.map(async (restaurant) => {
            try {
              const cats = await restaurantApi.getCategories(restaurant.id);
              if (cats.length === 0) {
                return restaurantMatchesCategory(restaurant, cuisine)
                  ? restaurant
                  : null;
              }
              const hasMenuCategory = cats.some((c) =>
                menuCategoryMatchesCuisine(c, cuisine)
              );
              if (hasMenuCategory) return restaurant;
              // Menu categories exist but don't match — keep cuisine-tagged partners
              return restaurantMatchesCategory(restaurant, cuisine)
                ? restaurant
                : null;
            } catch {
              return restaurantMatchesCategory(restaurant, cuisine)
                ? restaurant
                : null;
            }
          })
        );
        for (const row of rows) {
          if (row) matched.push(row);
        }
      }

      return {
        restaurants: matched,
        total: meta?.total && matched.length >= listed.length
          ? Math.max(meta.total, matched.length)
          : matched.length,
      };
    },
    enabled: input.enabled !== false && Boolean(cuisine) && cuisine !== 'all',
    staleTime: 60_000,
    retry: 1,
  });
}

export function useRestaurant(restaurantId: string) {
  return useQuery({
    queryKey: restaurantKeys.detail(restaurantId),
    queryFn: () => restaurantApi.getRestaurant(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantMenu(restaurantId: string) {
  return useQuery({
    queryKey: restaurantKeys.menu(restaurantId),
    queryFn: () => restaurantApi.getMenu(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantCategories(restaurantId: string) {
  return useQuery({
    queryKey: restaurantKeys.categories(restaurantId),
    queryFn: () => restaurantApi.getCategories(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantItems(restaurantId: string) {
  return useQuery({
    queryKey: restaurantKeys.items(restaurantId),
    queryFn: () => restaurantApi.getItems(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function prefetchRestaurantMenu(restaurantId: string) {
  if (!restaurantId) return;
  queryClient.prefetchQuery({
    queryKey: restaurantKeys.menu(restaurantId),
    queryFn: () => restaurantApi.getMenu(restaurantId),
  });
  queryClient.prefetchQuery({
    queryKey: restaurantKeys.categories(restaurantId),
    queryFn: () => restaurantApi.getCategories(restaurantId),
  });
  queryClient.prefetchQuery({
    queryKey: restaurantKeys.items(restaurantId),
    queryFn: () => restaurantApi.getItems(restaurantId),
  });
}

export function useMenuItem(restaurantId: string, itemId: string) {
  const isSeed = itemId.startsWith('seed-');
  const restaurant = useRestaurant(restaurantId);

  return useQuery({
    queryKey: restaurantKeys.item(restaurantId, itemId),
    queryFn: async () => {
      if (isSeed) {
        const found = findSeedMenuItem(restaurantId, itemId, {
          name: restaurant.data?.name,
          cuisines: restaurant.data?.cuisines,
        });
        if (!found) throw new Error('Item not found');
        return found;
      }
      return restaurantApi.getItem(restaurantId, itemId);
    },
    enabled: Boolean(
      restaurantId &&
        itemId &&
        (!isSeed || restaurant.isSuccess || restaurant.isError)
    ),
  });
}

export function useRestaurantOffers(restaurantId: string) {
  return useQuery({
    queryKey: restaurantKeys.offers(restaurantId),
    queryFn: () => restaurantApi.getOffers(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantOffer(restaurantId: string, offerId: string) {
  return useQuery({
    queryKey: restaurantKeys.offer(restaurantId, offerId),
    queryFn: () => restaurantApi.getOffer(restaurantId, offerId),
    enabled: Boolean(restaurantId && offerId),
  });
}

/** Newest restaurants for home horizontal rail. */
export function useNewlyAddedRestaurants(
  city?: string | null,
  options?: { enabled?: boolean; limit?: number }
) {
  return useQuery({
    queryKey: [...restaurantKeys.all, 'newly-added', city ?? '', options?.limit ?? 12],
    queryFn: () =>
      restaurantApi.getNewlyAdded({
        city: city || undefined,
        limit: options?.limit ?? 12,
      }),
    enabled: options?.enabled !== false && Boolean(city),
    staleTime: 60_000,
  });
}

/** Trending dishes (API menus) for home horizontal rail. */
export function useTrendingDishes(
  city?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...restaurantKeys.all, 'trending-dishes', city ?? ''],
    queryFn: () =>
      restaurantApi.getTrendingDishes({
        city: city || undefined,
        restaurantLimit: 8,
        dishLimit: 16,
      }),
    enabled: options?.enabled !== false && Boolean(city),
    staleTime: 90_000,
  });
}

/** Merges menu + categories + items; falls back to cuisine-specific seed menu. */
export function useFullMenu(
  restaurantId: string,
  seedOptions?: SeedMenuOptions
) {
  const menu = useRestaurantMenu(restaurantId);
  const categories = useRestaurantCategories(restaurantId);
  const items = useRestaurantItems(restaurantId);

  const menuFromApi = menu.data ?? { categories: [], items: [] };
  const categoriesFromApi = categories.data ?? [];
  const itemsFromApi = items.data ?? [];

  const menuItemsLookValid = menuFromApi.items.some(
    (item) => item.name && item.name !== 'Item' && item.price > 0
  );

  const mergedCategories = menuFromApi.categories.length
    ? menuFromApi.categories
    : categoriesFromApi;

  const mergedItems = useMemo(() => {
    const base = menuItemsLookValid
      ? menuFromApi.items
      : itemsFromApi.length
        ? itemsFromApi
        : menuFromApi.items;

    if (menuItemsLookValid && itemsFromApi.length) {
      return enrichMenuItems(base, itemsFromApi);
    }

    return base;
  }, [
    menuItemsLookValid,
    menuFromApi.items,
    itemsFromApi,
  ]);

  const isLoading = menu.isLoading || categories.isLoading || items.isLoading;
  const isError = menu.isError && categories.isError && items.isError;
  const apiHasMenu = mergedItems.length > 0;

  const finalCategories = mergedCategories;
  const finalItems = mergedItems;
  const isSeeded = false;

  return {
    categories: finalCategories,
    items: finalItems,
    isLoading,
    isError,
    isSeeded,
    refetch: () => {
      menu.refetch();
      categories.refetch();
      items.refetch();
    },
  };
}

// ------------------------------------------------------------------
// Mutations for Menu Items (Owner/Admin)
// ------------------------------------------------------------------

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateMenuItem(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { categoryId: string; payload: Record<string, unknown> }) =>
      restaurantApi.createItem(restaurantId, params.categoryId, params.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.items(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
    },
  });
}

export function useUpdateMenuItem(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { itemId: string; payload: Record<string, unknown> }) =>
      restaurantApi.updateItem(restaurantId, params.itemId, params.payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.items(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.item(restaurantId, variables.itemId) });
    },
  });
}

export function useDeleteMenuItem(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => restaurantApi.deleteItem(restaurantId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.items(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
    },
  });
}

export function useUpdateMenuItemAvailability(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { itemId: string; isAvailable: boolean }) =>
      restaurantApi.updateItemAvailability(restaurantId, params.itemId, params.isAvailable),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.items(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.item(restaurantId, variables.itemId) });
    },
  });
}

export function useUploadMenuItemImage(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { itemId: string; formData: FormData }) =>
      restaurantApi.uploadItemImage(restaurantId, params.itemId, params.formData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.items(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.item(restaurantId, variables.itemId) });
    },
  });
}

export function useBulkUpdateItemAvailability(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { itemIds: string[]; isAvailable: boolean }) =>
      restaurantApi.bulkUpdateAvailability(restaurantId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.items(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
    },
  });
}

export function useBulkImportMenuItems(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => restaurantApi.bulkImportItems(restaurantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.items(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
    },
  });
}
