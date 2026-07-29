import { useQuery } from '@tanstack/react-query';
import { restaurantOffersApi } from './offers-api';

export const restaurantOffersKeys = {
  all: ['restaurant-offers'] as const,
  list: (restaurantId: string) => [...restaurantOffersKeys.all, 'list', restaurantId] as const,
  detail: (restaurantId: string, offerId: string) => 
    [...restaurantOffersKeys.all, 'detail', restaurantId, offerId] as const,
};

/** GET /restaurants/:restaurantId/offers */
export function useRestaurantOffers(restaurantId: string) {
  return useQuery({
    queryKey: restaurantOffersKeys.list(restaurantId),
    queryFn: () => restaurantOffersApi.getOffers(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

/** GET /restaurants/:restaurantId/offers/:offerId */
export function useRestaurantOffer(restaurantId: string, offerId: string) {
  return useQuery({
    queryKey: restaurantOffersKeys.detail(restaurantId, offerId),
    queryFn: () => restaurantOffersApi.getOffer(restaurantId, offerId),
    enabled: Boolean(restaurantId) && Boolean(offerId),
  });
}