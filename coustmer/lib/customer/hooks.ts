import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { customerApi } from '@/lib/customer/api';
import type {
  AddTicketMessagePayload,
  CreateTicketPayload,
  RateTicketPayload,
} from '@/lib/customer/types';

export const customerKeys = {
  all: ['customer'] as const,
  home: () => [...customerKeys.all, 'home'] as const,
  deals: () => [...customerKeys.all, 'deals'] as const,
  offers: () => [...customerKeys.all, 'offers'] as const,
  recommended: () => [...customerKeys.all, 'recommended'] as const,
  profile: () => [...customerKeys.all, 'profile'] as const,
  favorites: () => [...customerKeys.all, 'favorites'] as const,
  recent: () => [...customerKeys.all, 'recent'] as const,
  onboarding: () => [...customerKeys.all, 'onboarding'] as const,
  tickets: () => [...customerKeys.all, 'tickets'] as const,
  ticket: (id: string) => [...customerKeys.all, 'ticket', id] as const,
};

export function useHomeFeed() {
  return useQuery({
    queryKey: customerKeys.home(),
    queryFn: customerApi.getHome,
  });
}

export function useDeals() {
  return useQuery({
    queryKey: customerKeys.deals(),
    queryFn: customerApi.getDeals,
  });
}

/** Home offer ticker — merges banners + deals from multiple customer APIs */
export function useOffersFeed() {
  return useQuery({
    queryKey: customerKeys.offers(),
    queryFn: customerApi.getOffersFeed,
    staleTime: 60_000,
  });
}

export function useRecommended() {
  return useQuery({
    queryKey: customerKeys.recommended(),
    queryFn: customerApi.getRecommended,
  });
}

export function useCustomerProfile() {
  return useQuery({
    queryKey: customerKeys.profile(),
    queryFn: customerApi.getProfile,
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: customerKeys.favorites(),
    queryFn: customerApi.getFavorites,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: customerKeys.recent(),
    queryFn: customerApi.getRecent,
  });
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: customerKeys.onboarding(),
    queryFn: customerApi.getOnboardingStatus,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) => customerApi.addFavorite(restaurantId),
    onSuccess: () => {
      // Soft refresh — do not clear optimistic local list if API is empty
      queryClient.invalidateQueries({
        queryKey: customerKeys.favorites(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.profile() });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) =>
      customerApi.removeFavorite(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.favorites() });
      queryClient.invalidateQueries({ queryKey: customerKeys.profile() });
    },
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (step: number) => customerApi.completeOnboardingStep(step),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.onboarding() });
      queryClient.invalidateQueries({ queryKey: customerKeys.profile() });
    },
  });
}

export function useTickets() {
  return useQuery({
    queryKey: customerKeys.tickets(),
    queryFn: customerApi.getTickets,
  });
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: customerKeys.ticket(ticketId),
    queryFn: () => customerApi.getTicket(ticketId),
    enabled: Boolean(ticketId),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      customerApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.tickets() });
    },
  });
}

export function useAddTicketMessage(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddTicketMessagePayload) =>
      customerApi.addTicketMessage(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.tickets() });
    },
  });
}

export function useRateTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RateTicketPayload) =>
      customerApi.rateTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.tickets() });
    },
  });
}
