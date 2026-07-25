import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/lib/dashboard/api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardStats(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.getDashboard(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
