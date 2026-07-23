import axios from 'axios';

import { api } from '@/lib/api';
import type {
  PaginationMeta,
  RatingDistribution,
  RestaurantReview,
  ReviewListResult,
  ReviewStats,
  SubmitReviewPayload,
} from '@/lib/review/types';

const REVIEW_SERVICE = '/api/v1/review-service';

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
};

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<Envelope<T>> {
  const { method = 'GET', body } = options;
  const isMutating = method !== 'GET';

  try {
    const response = await api.request<Envelope<T> | T>({
      url: path,
      method,
      data: isMutating ? (body ?? {}) : body,
      withCredentials: true,
      headers: isMutating
        ? {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }
        : { Accept: 'application/json' },
    });

    const payload = response.data as Envelope<T> | T;
    if (
      payload &&
      typeof payload === 'object' &&
      ('data' in (payload as object) || 'success' in (payload as object))
    ) {
      return payload as Envelope<T>;
    }

    return { success: true, data: payload as T };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error(
          'Network request failed. Check your internet connection and try again.'
        );
      }

      const data = error.response.data as
        | { message?: string; error?: string }
        | undefined;
      const message =
        data?.message || data?.error || `Request failed (${error.response.status})`;

      if (message.toLowerCase().includes('csrf')) {
        throw new Error(
          'Security token expired. Close and reopen the app, then try again.'
        );
      }

      const err = new Error(message) as Error & { status?: number };
      err.status = error.response.status;
      throw err;
    }

    throw error;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function extractList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const nested =
    record.reviews ??
    record.items ??
    record.results ??
    record.docs ??
    record.list ??
    record.data ??
    [];
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  if (nested && typeof nested === 'object') return extractList(nested);
  return [];
}

function clampRating(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n));
}

export function mapReview(raw: Record<string, unknown>): RestaurantReview {
  const user =
    raw.user && typeof raw.user === 'object'
      ? (raw.user as Record<string, unknown>)
      : undefined;

  return {
    id: String(raw._id ?? raw.id ?? ''),
    restaurantId: raw.restaurantId
      ? String(raw.restaurantId)
      : raw.restaurant
        ? String(raw.restaurant)
        : undefined,
    orderId: raw.orderId
      ? String(raw.orderId)
      : raw.order
        ? String(raw.order)
        : undefined,
    userId: raw.userId
      ? String(raw.userId)
      : user?.id
        ? String(user.id)
        : undefined,
    userName:
      (raw.userName as string) ||
      (raw.customerName as string) ||
      (user?.name as string) ||
      ([user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined) ||
      (raw.name as string) ||
      undefined,
    rating: clampRating(raw.rating ?? raw.stars ?? raw.score),
    comment:
      (raw.comment as string) ||
      (raw.review as string) ||
      (raw.text as string) ||
      (raw.body as string) ||
      undefined,
    title: (raw.title as string) || undefined,
    createdAt:
      (raw.createdAt as string) ||
      (raw.created_at as string) ||
      undefined,
    updatedAt:
      (raw.updatedAt as string) ||
      (raw.updated_at as string) ||
      undefined,
  };
}

function emptyDistribution(): RatingDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function mapStats(data: unknown): ReviewStats {
  const record = asRecord(data);
  const distRaw = asRecord(
    record.distribution ?? record.ratingDistribution ?? record.breakdown ?? {}
  );

  const distribution = emptyDistribution();
  ([1, 2, 3, 4, 5] as const).forEach((star) => {
    const value =
      distRaw[String(star)] ??
      distRaw[`${star}star`] ??
      distRaw[`${star}Star`] ??
      distRaw[`star${star}`];
    distribution[star] = Number(value) || 0;
  });

  return {
    average: clampRating(
      record.average ??
        record.avgRating ??
        record.averageRating ??
        record.rating ??
        0
    ),
    total: Number(
      record.total ??
        record.totalReviews ??
        record.count ??
        record.reviewCount ??
        0
    ) || 0,
    distribution,
  };
}

export const reviewApi = {
  /** GET /health */
  health: async (): Promise<boolean> => {
    try {
      const res = await request<unknown>(`${REVIEW_SERVICE}/health`);
      return res.success !== false;
    } catch {
      return false;
    }
  },

  /** GET /restaurants/:restaurantId/reviews */
  getRestaurantReviews: async (
    restaurantId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ReviewListResult> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();

    const res = await request<unknown>(
      `${REVIEW_SERVICE}/restaurants/${restaurantId}/reviews${qs ? `?${qs}` : ''}`
    );

    return {
      reviews: extractList(res.data).map(mapReview).filter((r) => r.id),
      meta: res.meta,
    };
  },

  /** GET /restaurants/:restaurantId/reviews/stats */
  getRestaurantReviewStats: async (
    restaurantId: string
  ): Promise<ReviewStats> => {
    const res = await request<unknown>(
      `${REVIEW_SERVICE}/restaurants/${restaurantId}/reviews/stats`
    );
    return mapStats(res.data);
  },

  /** POST /restaurants/:restaurantId/reviews */
  submitRestaurantReview: async (
    restaurantId: string,
    payload: SubmitReviewPayload
  ): Promise<RestaurantReview> => {
    const body = {
      rating: payload.rating,
      comment: payload.comment?.trim() || undefined,
      review: payload.comment?.trim() || undefined,
      title: payload.title?.trim() || undefined,
      orderId: payload.orderId || undefined,
    };

    const res = await request<Record<string, unknown>>(
      `${REVIEW_SERVICE}/restaurants/${restaurantId}/reviews`,
      { method: 'POST', body }
    );

    return mapReview(asRecord(res.data ?? {}));
  },

  /**
   * GET /orders/:orderId/review
   * Returns null when the user has not reviewed this order yet (404).
   */
  getOrderReview: async (
    orderId: string
  ): Promise<RestaurantReview | null> => {
    try {
      const res = await request<Record<string, unknown> | null>(
        `${REVIEW_SERVICE}/orders/${orderId}/review`
      );
      if (!res.data) return null;
      const mapped = mapReview(asRecord(res.data));
      return mapped.id || mapped.rating ? mapped : null;
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (
        status === 404 ||
        status === 204 ||
        message.includes('not found') ||
        message.includes('no review') ||
        message.includes('not reviewed')
      ) {
        return null;
      }
      throw error;
    }
  },
};
