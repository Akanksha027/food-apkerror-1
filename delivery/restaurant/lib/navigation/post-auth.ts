import type { PartnerRole } from '@/lib/auth/types';
import { restaurantOwnerApi } from '@/lib/restaurant/api';

export type PostAuthRoute = '/dashboard' | '/restaurant-setup';

export async function resolvePostAuthRoute(
  role: PartnerRole
): Promise<PostAuthRoute> {
  if (role === 'delivery') return '/dashboard';
  const my = await restaurantOwnerApi.getMyRestaurant();
  return my ? '/dashboard' : '/restaurant-setup';
}

export function restaurantSetupHref() {
  return '/restaurant-setup';
}
