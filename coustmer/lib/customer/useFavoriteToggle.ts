import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  customerKeys,
  useAddFavorite,
  useCustomerProfile,
  useFavorites,
  useRemoveFavorite,
} from '@/lib/customer/hooks';
import type { RestaurantCard } from '@/lib/customer/types';
import { useFavoritesStore } from '@/store/favorites-store';

type ToggleMeta = {
  restaurant?: Pick<
    RestaurantCard,
    'id' | 'name' | 'imageUrl' | 'rating' | 'cuisines' | 'deliveryTime'
  > &
    Record<string, unknown>;
};

/**
 * Instant heart toggles (local cards + API sync).
 * Fav page reads local cards so items always appear even if API is empty.
 */
export function useFavoriteToggle() {
  const queryClient = useQueryClient();
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const addLocal = useFavoritesStore((s) => s.add);
  const removeLocal = useFavoritesStore((s) => s.remove);
  const mergeFromServer = useFavoritesStore((s) => s.mergeFromServer);

  const profile = useCustomerProfile();
  const favoritesQuery = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  useEffect(() => {
    const fromProfile = profile.data?.favoriteRestaurants ?? [];
    if (fromProfile.length) mergeFromServer(fromProfile.map(String));
  }, [profile.data?.favoriteRestaurants, mergeFromServer]);

  useEffect(() => {
    const list = favoritesQuery.data ?? [];
    if (list.length) {
      mergeFromServer(
        list.map((r) => String(r.id)),
        list
      );
    }
  }, [favoritesQuery.data, mergeFromServer]);

  const isFavorite = (id: string) => favoriteIds.includes(id);

  const toCard = (id: string, meta?: ToggleMeta): RestaurantCard => ({
    id,
    name: meta?.restaurant?.name || 'Restaurant',
    imageUrl: meta?.restaurant?.imageUrl as string | undefined,
    rating: meta?.restaurant?.rating,
    cuisines: meta?.restaurant?.cuisines,
    deliveryTime: meta?.restaurant?.deliveryTime,
    coverUrl: meta?.restaurant?.coverUrl as string | undefined,
    address: meta?.restaurant?.address as string | undefined,
    city: meta?.restaurant?.city as string | undefined,
    distance: meta?.restaurant?.distance as number | undefined,
    reviewCount: meta?.restaurant?.reviewCount as number | undefined,
  });

  const toggleFavorite = (id: string, meta?: ToggleMeta) => {
    if (!id) return;

    const wasFav = favoriteIds.includes(id);

    if (wasFav) {
      removeLocal(id);
      queryClient.setQueryData<RestaurantCard[]>(
        customerKeys.favorites(),
        (old) => (old ?? []).filter((r) => String(r.id) !== id)
      );
      queryClient.setQueryData(customerKeys.profile(), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const prev = old as { favoriteRestaurants?: string[] };
        return {
          ...prev,
          favoriteRestaurants: (prev.favoriteRestaurants ?? []).filter(
            (x) => x !== id
          ),
        };
      });
      removeFavorite.mutate(id, {
        onError: () => {
          addLocal(id, meta?.restaurant ? toCard(id, meta) : undefined);
        },
      });
      return;
    }

    const card = toCard(id, meta);
    addLocal(id, card);
    queryClient.setQueryData<RestaurantCard[]>(
      customerKeys.favorites(),
      (old) => {
        const list = old ?? [];
        if (list.some((r) => String(r.id) === id)) return list;
        return [card, ...list];
      }
    );
    queryClient.setQueryData(customerKeys.profile(), (old: unknown) => {
      if (!old || typeof old !== 'object') return old;
      const prev = old as { favoriteRestaurants?: string[] };
      const current = prev.favoriteRestaurants ?? [];
      if (current.includes(id)) return prev;
      return { ...prev, favoriteRestaurants: [...current, id] };
    });

    addFavorite.mutate(id, {
      onError: () => {
        // Keep local favorite — Fav page still shows it
      },
    });
  };

  const pendingId =
    (addFavorite.isPending && addFavorite.variables) ||
    (removeFavorite.isPending && removeFavorite.variables) ||
    null;

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    pendingId: pendingId ? String(pendingId) : null,
  };
}
