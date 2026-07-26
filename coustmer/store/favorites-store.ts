import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { RestaurantCard } from '@/lib/customer/types';

type FavoritesState = {
  ids: string[];
  /** Full restaurant cards so Fav page can render without waiting on API. */
  byId: Record<string, RestaurantCard>;
  add: (id: string, card?: RestaurantCard) => void;
  remove: (id: string) => void;
  /** Returns true if now favorited */
  toggle: (id: string, card?: RestaurantCard) => boolean;
  isFavorite: (id: string) => boolean;
  upsertCard: (card: RestaurantCard) => void;
  /** Union server ids / cards into local set (does not remove local-only). */
  mergeFromServer: (ids: string[], cards?: RestaurantCard[]) => void;
};

function normalizeCard(
  id: string,
  card?: RestaurantCard
): RestaurantCard | undefined {
  if (!card) return undefined;
  return {
    ...card,
    id: String(card.id || id),
    name: card.name || 'Restaurant',
  };
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      byId: {},
      add: (id, card) => {
        if (!id) return;
        const normalized = normalizeCard(id, card);
        set((s) => {
          const ids = s.ids.includes(id) ? s.ids : [id, ...s.ids];
          const byId = { ...s.byId };
          if (normalized) byId[id] = normalized;
          return { ids, byId };
        });
      },
      remove: (id) => {
        if (!id) return;
        set((s) => {
          const { [id]: _, ...rest } = s.byId;
          return {
            ids: s.ids.filter((x) => x !== id),
            byId: rest,
          };
        });
      },
      toggle: (id, card) => {
        if (!id) return false;
        const on = get().ids.includes(id);
        if (on) get().remove(id);
        else get().add(id, card);
        return !on;
      },
      isFavorite: (id) => get().ids.includes(id),
      upsertCard: (card) => {
        const id = String(card.id ?? '');
        if (!id) return;
        set((s) => ({
          byId: { ...s.byId, [id]: normalizeCard(id, card)! },
        }));
      },
      mergeFromServer: (ids, cards) => {
        const clean = ids.map(String).filter(Boolean);
        set((s) => {
          const nextIds = new Set(s.ids);
          for (const id of clean) nextIds.add(id);
          const byId = { ...s.byId };
          for (const card of cards ?? []) {
            const id = String(card.id ?? '');
            if (!id) continue;
            byId[id] = normalizeCard(id, card)!;
            nextIds.add(id);
          }
          return { ids: [...nextIds], byId };
        });
      },
    }),
    {
      name: 'customer-favorites-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ ids: s.ids, byId: s.byId }),
    }
  )
);
