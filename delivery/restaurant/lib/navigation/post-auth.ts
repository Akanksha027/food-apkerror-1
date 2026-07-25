import type { PartnerRole } from '@/lib/auth/types';
import { restaurantOwnerApi } from '@/lib/restaurant/api';
import type { RestaurantOwnerRestaurant } from '@/lib/restaurant/types';

export type PostAuthRoute = '/dashboard' | '/restaurant-setup';

/**
 * Once GET /restaurants/my returns a record (id + name), treat onboarding as done.
 */
export function isRestaurantProfileComplete(
  restaurant: RestaurantOwnerRestaurant | null | undefined
): boolean {
  if (!restaurant?.id?.trim()) return false;
  if (!String(restaurant.name ?? '').trim()) return false;
  return true;
}

export async function resolvePostAuthRoute(
  role: PartnerRole
): Promise<PostAuthRoute> {
  if (role === 'delivery') return '/dashboard';

  const my = await restaurantOwnerApi.getMyRestaurant();
  return isRestaurantProfileComplete(my)
    ? '/dashboard'
    : '/restaurant-setup';
}

export function restaurantSetupHref() {
  return '/restaurant-setup';
}
