import axios from 'axios';

import { api } from '@/lib/api';
import {
  buildRevenueBars,
  computeTrendPercent,
  trendInsight,
} from '@/lib/dashboard/format';
import type { DashboardData } from '@/lib/dashboard/types';
import { restaurantOrderApi } from '@/lib/order/owner-api';
import { restaurantOwnerApi } from '@/lib/restaurant/api';
import { restaurantMenuApi } from '@/lib/restaurant/menu-api';

const RESTAURANT_BASE = '/api/v1/restaurant-service/restaurants';
const REVIEW_BASE = '/api/v1/review-service/restaurants';

type Envelope<T> = {
  success?: boolean;
  data?: T;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function numberField(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

async function getMenuItemCount(restaurantId: string): Promise<number> {
  try {
    const res = await api.get<Envelope<unknown>>(
      `${RESTAURANT_BASE}/${restaurantId}/items`,
      { withCredentials: true }
    );
    const raw = res.data?.data ?? res.data;
    return Array.isArray(raw) ? raw.length : 0;
  } catch {
    return 0;
  }
}

async function getActivePromoCount(restaurantId: string): Promise<number> {
  try {
    const res = await api.get<Envelope<unknown>>(
      `${RESTAURANT_BASE}/${restaurantId}/offers`,
      { withCredentials: true }
    );
    const raw = res.data?.data ?? res.data;
    if (!Array.isArray(raw)) return 0;
    return raw.filter((row) => {
      const offer = asRecord(row);
      const active = offer.isActive ?? offer.active ?? offer.status;
      if (typeof active === 'boolean') return active;
      if (typeof active === 'string') {
        return active.toLowerCase() === 'active' || active.toLowerCase() === 'live';
      }
      return true;
    }).length;
  } catch {
    return 0;
  }
}

async function getReviewStats(restaurantId: string): Promise<{
  average: number;
  total: number;
}> {
  try {
    const res = await api.get<Envelope<Record<string, unknown>>>(
      `${REVIEW_BASE}/${restaurantId}/reviews/stats`
    );
    const data = asRecord(res.data?.data ?? res.data);
    return {
      average: Number(data.average ?? data.avgRating ?? data.rating ?? 0),
      total: Number(data.total ?? data.totalRatings ?? data.count ?? 0),
    };
  } catch {
    return { average: 0, total: 0 };
  }
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardData | null> => {
    const restaurant = await restaurantOwnerApi.getMyRestaurant();
    if (!restaurant?.id) return null;

    const record = restaurant as Record<string, unknown>;
    const settings = asRecord(record.settings);

    const [
      reviewStats,
      menuItems,
      activePromos,
      pendingOrders,
      activeOrdersFromApi,
    ] = await Promise.all([
      getReviewStats(restaurant.id),
      getMenuItemCount(restaurant.id),
      getActivePromoCount(restaurant.id),
      restaurantOrderApi.getPendingOrders(restaurant.id),
      restaurantOrderApi.countActiveOrders(restaurant.id),
    ]);

    const grossRevenue = numberField(record, [
      'todayRevenue',
      'totalRevenue',
      'revenueToday',
      'grossRevenue',
    ]);
    const yesterdayRevenue = numberField(record, [
      'yesterdayRevenue',
      'previousDayRevenue',
      'revenueYesterday',
    ]);
    const totalOrders = numberField(record, ['totalOrders', 'ordersCount']);
    const currentOrderCount = numberField(record, [
      'currentOrderCount',
      'activeOrders',
      'liveOrders',
    ]);

    const revenueTrendPercent = computeTrendPercent(
      grossRevenue,
      yesterdayRevenue > 0 ? yesterdayRevenue : grossRevenue * 0.88
    );
    const insightCopy = trendInsight(revenueTrendPercent);

    const rating =
      reviewStats.average ||
      numberField(record, ['avgRating', 'rating', 'averageRating']);
    const totalRatings =
      reviewStats.total ||
      numberField(record, ['totalRatings', 'reviewCount', 'ratingsCount']);

    const avgDeliveryMinutes =
      numberField(settings, ['avgPrepTime', 'avgDeliveryTime', 'deliveryTime']) ||
      numberField(record, ['avgDeliveryTime', 'deliveryTime']) ||
      24;

    const activeOrders = Math.max(
      activeOrdersFromApi,
      currentOrderCount,
      pendingOrders.length
    );

    // Warm up menu cache for future screens.
    void restaurantMenuApi.getCategories(restaurant.id).catch(() => undefined);

    const address = asRecord(record.address);
    const city =
      String(address.city ?? record.city ?? '').trim() || undefined;

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      city,
      logoUrl: restaurant.logoUrl,
      insight: {
        title: insightCopy.title,
        subtitle: insightCopy.subtitle,
        trendPercent: revenueTrendPercent,
      },
      metrics: {
        grossRevenue,
        revenueTrendPercent,
        yesterdayRevenue:
          yesterdayRevenue > 0 ? yesterdayRevenue : grossRevenue * 0.88,
        revenueBars: buildRevenueBars(grossRevenue, totalOrders),
        rating: rating > 0 ? rating : 0,
        ratingMax: 5,
        totalRatings,
        avgDeliveryMinutes,
        isOnline: Boolean(record.isOnline ?? record.isActive ?? true),
      },
      quickActions: {
        activeOrders,
        menuItems,
        activePromos,
      },
      pendingOrders: pendingOrders.slice(0, 6),
    };
  },
};
