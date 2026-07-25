import { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';

const RestaurantDashboard = lazy(() =>
  import('@/components/dashboard/RestaurantDashboard').then((mod) => ({
    default: mod.RestaurantDashboard,
  }))
);

const DeliveryDashboardFallback = lazy(() =>
  import('@/components/dashboard/DeliveryDashboardFallback').then((mod) => ({
    default: mod.DeliveryDashboardFallback,
  }))
);

function DashboardFallback() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF7F2',
      }}
    >
      <ActivityIndicator color={authTheme.brand} size="large" />
    </View>
  );
}

export default function DashboardScreen() {
  const role = useAuthStore((s) => s.user?.role ?? s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return <DashboardFallback />;
  }

  return (
    <Suspense fallback={<DashboardFallback />}>
      {role === 'delivery' ? <DeliveryDashboardFallback /> : <RestaurantDashboard />}
    </Suspense>
  );
}
