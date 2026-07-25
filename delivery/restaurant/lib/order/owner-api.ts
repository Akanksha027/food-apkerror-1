import axios from 'axios';

import { api } from '@/lib/api';
import type { OwnerOrder, OwnerOrderItem } from '@/lib/dashboard/types';

const ORDER_SERVICE = '/api/v1/order-service';
const RESTAURANT_SERVICE = '/api/v1/restaurant-service/restaurants';

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function extractList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const nested =
    record.orders ??
    record.items ??
    record.results ??
    record.docs ??
    record.pendingOrders ??
    record.activeOrders ??
    record.data;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  if (nested && typeof nested === 'object') return extractList(nested);
  return [];
}

function mapItems(raw: unknown): OwnerOrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const item = asRecord(row);
    return {
      name: String(item.name ?? item.itemName ?? item.title ?? 'Item'),
      quantity: Number(item.quantity ?? item.qty ?? 1),
    };
  });
}

function fulfillmentMeta(order: Record<string, unknown>): {
  label: string;
  tone: OwnerOrder['fulfillmentTone'];
} {
  const type = String(
    order.orderType ?? order.fulfillmentType ?? order.serviceType ?? order.type ?? ''
  ).toLowerCase();

  if (type.includes('dine') || type.includes('table')) {
    const table = String(order.tableNumber ?? order.tableNo ?? order.table ?? '').trim();
    return { label: table ? `TABLE ${table.padStart(2, '0')}` : 'DINE IN', tone: 'table' };
  }

  if (type.includes('pickup') || type.includes('takeaway')) {
    return { label: 'PICKUP', tone: 'pickup' };
  }

  const channel = String(order.channel ?? order.source ?? '').toLowerCase();
  if (channel.includes('app') || type.includes('delivery')) {
    return { label: 'DELIVERY APP', tone: 'delivery' };
  }

  if (order.deliveryAddress) {
    return { label: 'DELIVERY APP', tone: 'delivery' };
  }

  return { label: 'IN STORE', tone: 'table' };
}

export function mapOwnerOrder(data: Record<string, unknown>): OwnerOrder {
  const items = mapItems(data.items ?? data.orderItems ?? data.cartItems);
  const fulfillment = fulfillmentMeta(data);

  return {
    id: String(data._id ?? data.id ?? ''),
    orderNumber: String(
      data.orderNumber ?? data.orderNo ?? data.number ?? data.code ?? data._id ?? ''
    ),
    status: String(data.status ?? data.orderStatus ?? 'pending'),
    items,
    total: Number(data.total ?? data.grandTotal ?? data.totalAmount ?? 0) || undefined,
    fulfillmentLabel: fulfillment.label,
    fulfillmentTone: fulfillment.tone,
    createdAt: (data.createdAt as string) || undefined,
  };
}

const PENDING_STATUSES = new Set([
  'pending',
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'accepted',
]);

async function fetchFromPath(path: string): Promise<OwnerOrder[]> {
  const res = await api.get<Envelope<unknown>>(path, { withCredentials: true });
  const raw = res.data?.data ?? res.data;
  return extractList(raw).map((row) => mapOwnerOrder(row));
}

export const restaurantOrderApi = {
  /** Loads restaurant-scoped orders; tries known gateway paths until one succeeds. */
  getRestaurantOrders: async (restaurantId: string): Promise<OwnerOrder[]> => {
    const candidates = [
      `${RESTAURANT_SERVICE}/${restaurantId}/orders`,
      `${ORDER_SERVICE}/restaurants/${restaurantId}/orders`,
      `${ORDER_SERVICE}/orders?restaurantId=${restaurantId}&limit=50`,
      `${ORDER_SERVICE}/orders?restaurantId=${restaurantId}&status=pending,preparing,confirmed&limit=50`,
    ];

    for (const path of candidates) {
      try {
        const orders = await fetchFromPath(path);
        if (orders.length) return orders;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) continue;
      }
    }

    return [];
  },

  getPendingOrders: async (restaurantId: string): Promise<OwnerOrder[]> => {
    const orders = await restaurantOrderApi.getRestaurantOrders(restaurantId);
    return orders
      .filter((order) => PENDING_STATUSES.has(order.status.toLowerCase()))
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  },

  countActiveOrders: async (restaurantId: string): Promise<number> => {
    const orders = await restaurantOrderApi.getRestaurantOrders(restaurantId);
    return orders.filter((order) => PENDING_STATUSES.has(order.status.toLowerCase())).length;
  },
};
