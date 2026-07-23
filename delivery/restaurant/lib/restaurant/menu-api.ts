import axios from 'axios';

import { api } from '@/lib/api';
import type { MenuCategory, MenuItem } from '@/lib/restaurant/types';

const RESTAURANT_BASE = '/api/v1/restaurant-service/restaurants';

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function extractId(data: Record<string, unknown> | undefined) {
  if (!data) return '';
  return String(data._id ?? data.id ?? '');
}

function extractError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Network request failed.';
    const data = error.response.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || `Request failed (${error.response.status})`;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export type CreateCategoryPayload = {
  name: string;
  description?: string;
  sortOrder?: number;
};

export type CreateMenuItemPayload = {
  name: string;
  description?: string;
  price: number;
  isVeg?: boolean;
  isAvailable?: boolean;
  imageUrl?: string;
};

export type BulkImportCategory = CreateCategoryPayload & {
  items?: CreateMenuItemPayload[];
};

export type BulkImportPayload = {
  categories?: BulkImportCategory[];
  items?: (CreateMenuItemPayload & { categoryName?: string })[];
  menu?: { categories?: BulkImportCategory[] };
};

export const restaurantMenuApi = {
  getCategories: async (restaurantId: string): Promise<MenuCategory[]> => {
    const res = await api.get<Envelope<Record<string, unknown>[]>>(
      `${RESTAURANT_BASE}/${restaurantId}/categories`
    );
    const rows = res.data?.data ?? [];
    return rows.map((row) => ({
      id: extractId(row),
      name: String(row.name ?? 'Category'),
      description: (row.description as string) || undefined,
      sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : undefined,
    }));
  },

  createCategory: async (
    restaurantId: string,
    payload: CreateCategoryPayload
  ): Promise<MenuCategory> => {
    try {
      const res = await api.post<Envelope<Record<string, unknown>>>(
        `${RESTAURANT_BASE}/${restaurantId}/categories`,
        payload,
        { withCredentials: true }
      );
      const data = (res.data?.data ?? res.data) as Record<string, unknown>;
      return {
        id: extractId(data),
        name: String(data.name ?? payload.name),
        sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : payload.sortOrder,
      };
    } catch (error) {
      throw new Error(extractError(error, 'Failed to create category'));
    }
  },

  createItem: async (
    restaurantId: string,
    categoryId: string,
    payload: CreateMenuItemPayload
  ): Promise<MenuItem> => {
    try {
      const res = await api.post<Envelope<Record<string, unknown>>>(
        `${RESTAURANT_BASE}/${restaurantId}/categories/${categoryId}/items`,
        payload,
        { withCredentials: true }
      );
      const data = (res.data?.data ?? res.data) as Record<string, unknown>;
      return {
        id: extractId(data),
        name: String(data.name ?? payload.name),
        description: (data.description as string) || payload.description,
        price: Number(data.price ?? payload.price),
        isVeg: data.isVeg !== undefined ? Boolean(data.isVeg) : payload.isVeg,
        isAvailable:
          data.isAvailable !== undefined ? Boolean(data.isAvailable) : true,
        imageUrl: (data.imageUrl as string) || payload.imageUrl,
        categoryId,
      };
    } catch (error) {
      throw new Error(extractError(error, 'Failed to create menu item'));
    }
  },

  bulkImport: async (restaurantId: string, payload: BulkImportPayload) => {
    try {
      const res = await api.post<Envelope<unknown>>(
        `${RESTAURANT_BASE}/${restaurantId}/items/bulk-import`,
        payload,
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      throw new Error(extractError(error, 'Bulk menu import failed'));
    }
  },

  /** Upload seed menu: tries bulk-import, falls back to category + item POSTs. */
  seedMenuFromPayload: async (
    restaurantId: string,
    categories: BulkImportCategory[]
  ) => {
    const bulkPayloads: BulkImportPayload[] = [
      { categories },
      { menu: { categories } },
      {
        items: categories.flatMap((cat) =>
          (cat.items ?? []).map((item) => ({
            ...item,
            categoryName: cat.name,
          }))
        ),
      },
    ];

    for (const body of bulkPayloads) {
      try {
        return await restaurantMenuApi.bulkImport(restaurantId, body);
      } catch {
        // try next shape
      }
    }

    for (const category of categories) {
      const created = await restaurantMenuApi.createCategory(restaurantId, {
        name: category.name,
        sortOrder: category.sortOrder,
        description: category.description,
      });

      for (const item of category.items ?? []) {
        await restaurantMenuApi.createItem(restaurantId, created.id, item);
      }
    }

    return { success: true, mode: 'manual' };
  },
};
