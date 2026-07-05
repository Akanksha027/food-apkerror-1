import axios from 'axios';

import { api } from '@/lib/api';
import type {
  AddTicketMessagePayload,
  CreateTicketPayload,
  CustomerProfile,
  Deal,
  HomeFeed,
  OnboardingStatus,
  PaginationMeta,
  RateTicketPayload,
  RecentActivity,
  Recommendation,
  RestaurantCard,
  SupportTicket,
} from '@/lib/customer/types';

const CUSTOMER_BASE = '/api/v1/customer-service/customers';

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

  try {
    const response = await api.request<Envelope<T>>({
      url: path,
      method,
      data: body,
      withCredentials: true,
    });
    return response.data;
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

      throw new Error(message);
    }

    throw error;
  }
}

function mapProfile(data: Record<string, unknown>): CustomerProfile {
  return {
    id: String(data._id ?? data.id ?? ''),
    userId: String(data.userId ?? ''),
    totalOrders: Number(data.totalOrders ?? 0),
    totalSpend: Number(data.totalSpend ?? 0),
    averageOrderValue: Number(data.averageOrderValue ?? 0),
    favoriteRestaurants: (data.favoriteRestaurants as string[]) ?? [],
    favoriteDishes: (data.favoriteDishes as string[]) ?? [],
    recentSearches: (data.recentSearches as string[]) ?? [],
    recentRestaurants: (data.recentRestaurants as string[]) ?? [],
    tier: String(data.tier ?? 'bronze'),
    loyaltyPoints: Number(data.loyaltyPoints ?? 0),
    onboardingCompleted: Boolean(data.onboardingCompleted ?? false),
    onboardingStep: Number(data.onboardingStep ?? 0),
  };
}

function mapTicket(data: Record<string, unknown>): SupportTicket {
  return {
    id: String(data._id ?? data.id ?? ''),
    userId: String(data.userId ?? ''),
    category: data.category as SupportTicket['category'],
    subject: String(data.subject ?? ''),
    description: String(data.description ?? ''),
    status: (data.status as SupportTicket['status']) ?? 'open',
    priority: String(data.priority ?? 'medium'),
    attachments: (data.attachments as string[]) ?? [],
    messages: (data.messages as SupportTicket['messages']) ?? [],
    rating: data.rating as number | undefined,
    feedback: data.feedback as string | undefined,
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

export const customerApi = {
  /** GET /customers/home */
  getHome: async (): Promise<HomeFeed> => {
    const res = await request<HomeFeed>(`${CUSTOMER_BASE}/home`);
    return {
      banners: res.data?.banners ?? [],
      trending: res.data?.trending ?? [],
      forYou: res.data?.forYou ?? [],
      newlyAdded: res.data?.newlyAdded ?? [],
    };
  },

  /** GET /customers/deals */
  getDeals: async (): Promise<Deal[]> => {
    const res = await request<Deal[]>(`${CUSTOMER_BASE}/deals`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /** GET /customers/recommended */
  getRecommended: async (): Promise<Recommendation[]> => {
    const res = await request<Recommendation[]>(`${CUSTOMER_BASE}/recommended`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /** GET /customers/me */
  getProfile: async (): Promise<CustomerProfile> => {
    const res = await request<Record<string, unknown>>(`${CUSTOMER_BASE}/me`);
    return mapProfile(res.data ?? {});
  },

  /** GET /customers/me/favorites */
  getFavorites: async (): Promise<RestaurantCard[]> => {
    const res = await request<RestaurantCard[]>(`${CUSTOMER_BASE}/me/favorites`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /** POST /customers/me/favorites/:restaurantId */
  addFavorite: async (restaurantId: string): Promise<void> => {
    await request(`${CUSTOMER_BASE}/me/favorites/${restaurantId}`, {
      method: 'POST',
    });
  },

  /** DELETE /customers/me/favorites/:restaurantId */
  removeFavorite: async (restaurantId: string): Promise<void> => {
    await request(`${CUSTOMER_BASE}/me/favorites/${restaurantId}`, {
      method: 'DELETE',
    });
  },

  /** GET /customers/me/recent */
  getRecent: async (): Promise<RecentActivity> => {
    const res = await request<RecentActivity>(`${CUSTOMER_BASE}/me/recent`);
    return {
      recentSearches: res.data?.recentSearches ?? [],
      recentRestaurants: res.data?.recentRestaurants ?? [],
    };
  },

  /** GET /customers/onboarding/status */
  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    const res = await request<OnboardingStatus>(
      `${CUSTOMER_BASE}/onboarding/status`
    );
    return {
      completed: res.data?.completed ?? false,
      currentStep: res.data?.currentStep ?? 0,
      totalSteps: res.data?.totalSteps ?? 0,
    };
  },

  /** POST /customers/onboarding/complete */
  completeOnboardingStep: async (step: number): Promise<OnboardingStatus> => {
    const res = await request<OnboardingStatus>(
      `${CUSTOMER_BASE}/onboarding/complete`,
      { method: 'POST', body: { step } }
    );
    return {
      completed: res.data?.completed ?? false,
      currentStep: res.data?.currentStep ?? step,
      totalSteps: res.data?.totalSteps ?? 0,
    };
  },

  /** POST /customers/support/tickets */
  createTicket: async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    const res = await request<Record<string, unknown>>(
      `${CUSTOMER_BASE}/support/tickets`,
      { method: 'POST', body: payload }
    );
    return mapTicket(res.data ?? {});
  },

  /** GET /customers/support/tickets */
  getTickets: async (): Promise<{
    tickets: SupportTicket[];
    meta?: PaginationMeta;
  }> => {
    const res = await request<Record<string, unknown>[]>(
      `${CUSTOMER_BASE}/support/tickets`
    );
    const tickets = Array.isArray(res.data) ? res.data.map(mapTicket) : [];
    return { tickets, meta: res.meta };
  },

  /** GET /customers/support/tickets/:ticketId */
  getTicket: async (ticketId: string): Promise<SupportTicket> => {
    const res = await request<Record<string, unknown>>(
      `${CUSTOMER_BASE}/support/tickets/${ticketId}`
    );
    return mapTicket(res.data ?? {});
  },

  /** POST /customers/support/tickets/:ticketId/messages */
  addTicketMessage: async (
    ticketId: string,
    payload: AddTicketMessagePayload
  ): Promise<SupportTicket> => {
    const res = await request<Record<string, unknown>>(
      `${CUSTOMER_BASE}/support/tickets/${ticketId}/messages`,
      { method: 'POST', body: payload }
    );
    return mapTicket(res.data ?? {});
  },

  /** POST /customers/support/tickets/:ticketId/rate */
  rateTicket: async (
    ticketId: string,
    payload: RateTicketPayload
  ): Promise<SupportTicket> => {
    const res = await request<Record<string, unknown>>(
      `${CUSTOMER_BASE}/support/tickets/${ticketId}/rate`,
      { method: 'POST', body: payload }
    );
    return mapTicket(res.data ?? {});
  },
};
