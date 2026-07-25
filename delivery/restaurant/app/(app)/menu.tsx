import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useDashboardStats } from '@/lib/dashboard/hooks';

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useDashboardStats();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.accentBar} />
        <View>
          <Text style={styles.title}>Menu</Text>
          <Text style={styles.subtitle}>Items synced from restaurant-service</Text>
        </View>
      </View>

      <View style={styles.center}>
        {isLoading ? (
          <ActivityIndicator color={authTheme.brand} />
        ) : (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.quickActions.menuItems ?? 0}</Text>
            <Text style={styles.statLabel}>
              menu items live on your restaurant profile
            </Text>
          </View>
        )}
      </View>

      <DashboardTabBar
        active="menu"
        centerBadge={data?.quickActions.activeOrders}
        onNavigate={(href) => router.push(href)}
        onCenterPress={() => router.push('/menu')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: authTheme.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: authTheme.bg,
    borderBottomWidth: 1,
    borderBottomColor: authTheme.cardBorder,
  },
  accentBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: authTheme.brand,
  },
  title: {
    color: authTheme.text,
    fontSize: 22,
    fontFamily: fonts.extraBold,
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: PARTNER_BOTTOM_NAV_INSET,
  },
  statCard: {
    backgroundColor: authTheme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statValue: {
    color: authTheme.brand,
    fontSize: 48,
    fontFamily: fonts.extraBold,
    letterSpacing: -1,
  },
  statLabel: {
    marginTop: 8,
    color: authTheme.textMuted,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
});
