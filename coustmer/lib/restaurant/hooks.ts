import { useQuery } from '@tanstack/react-query';

import { restaurantApi } from '@/lib/restaurant/api';
import type { NearbyParams, RestaurantListParams } from '@/lib/restaurant/types';

export const restaurantKeys = {
  all: ['restaurant'] as const,
  list: (params: RestaurantListParams) =>
    [...restaurantKeys.all, 'list', params] as const,
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
  return useQuery({
    queryKey: restaurantKeys.list(params),
    queryFn: () => restaurantApi.getRestaurants(params),
  });
}

export function useNearbyRestaurants(params: NearbyParams | null) {
  return useQuery({
    queryKey: restaurantKeys.nearby(params ?? { lat: 0, lng: 0 }),
    queryFn: () => restaurantApi.getNearby(params!),
    enabled: Boolean(params?.lat && params?.lng),
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

export function useMenuItem(restaurantId: string, itemId: string) {
  return useQuery({
    queryKey: restaurantKeys.item(restaurantId, itemId),
    queryFn: () => restaurantApi.getItem(restaurantId, itemId),
    enabled: Boolean(restaurantId && itemId),
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

/** Merges menu + categories + items for a complete menu view. */
export function useFullMenu(restaurantId: string) {
  const menu = useRestaurantMenu(restaurantId);
  const categories = useRestaurantCategories(restaurantId);
  const items = useRestaurantItems(restaurantId);

  const mergedCategories =
    menu.data?.categories.length
      ? menu.data.categories
      : categories.data ?? [];

  const mergedItems = menu.data?.items.length
    ? menu.data.items
    : items.data ?? [];

  const isLoading = menu.isLoading || categories.isLoading || items.isLoading;
  const isError = menu.isError && categories.isError && items.isError;

  return {
    categories: mergedCategories,
    items: mergedItems,
    isLoading,
    isError,
    refetch: () => {
      menu.refetch();
      categories.refetch();
      items.refetch();
    },
  };
}
