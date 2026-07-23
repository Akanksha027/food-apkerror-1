import { useQuery } from '@tanstack/react-query';

import { homeDiscoveryApi } from '@/lib/home/api';

export const homeDiscoveryKeys = {
  all: ['home-discovery'] as const,
  city: (city?: string | null) =>
    [...homeDiscoveryKeys.all, city ?? ''] as const,
};

/** Newly added + trending + categories (API when ready, dummy until then). */
export function useHomeDiscovery(city?: string | null) {
  return useQuery({
    queryKey: homeDiscoveryKeys.city(city),
    queryFn: () => homeDiscoveryApi.getHomeDiscovery(city || undefined),
    staleTime: 60_000,
    retry: 1,
  });
}
