import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronRight,
  KeyRound,
  LogOut,
  MailCheck,
  MonitorSmartphone,
} from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { useDashboardStats } from '@/lib/dashboard/hooks';

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const resendEmailVerification = useAuthStore((s) => s.resendEmailVerification);
  const { data } = useDashboardStats();

  const confirmLogout = (all: boolean) => {
    Alert.alert(
      all ? 'Log out everywhere?' : 'Log out?',
      all ? 'This will end your session on all devices.' : 'You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await (all ? logoutAll() : logout());
            router.replace('/login');
          },
        },
      ]
    );
  };

  const rows = [
    {
      label: 'Change password',
      icon: KeyRound,
      onPress: () => router.push('/change-password'),
    },
    {
      label: 'Resend email verification',
      icon: MailCheck,
      onPress: async () => {
        try {
          await resendEmailVerification();
          Alert.alert('Email sent', 'Verification link sent to your inbox.');
        } catch (err) {
          Alert.alert('Failed', err instanceof Error ? err.message : 'Could not resend email');
        }
      },
    },
    {
      label: 'Log out all devices',
      icon: MonitorSmartphone,
      onPress: () => confirmLogout(true),
    },
    {
      label: 'Log out',
      icon: LogOut,
      danger: true,
      onPress: () => confirmLogout(false),
    },
  ] as const;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.accentBar} />
        <View>
          <Text style={styles.title}>Admin</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          {rows.map((row, index) => {
            const Icon = row.icon;
            const danger = 'danger' in row && row.danger;
            return (
              <View key={row.label}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  onPress={row.onPress}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <Icon color={danger ? authTheme.error : authTheme.text} size={20} />
                  <Text style={[styles.rowLabel, danger && styles.dangerText]}>
                    {row.label}
                  </Text>
                  <ChevronRight color={authTheme.textDim} size={18} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <DashboardTabBar
        active="admin"
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: PARTNER_BOTTOM_NAV_INSET + 16,
  },
  card: {
    backgroundColor: authTheme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pressed: {
    backgroundColor: authTheme.bgSoft,
  },
  rowLabel: {
    flex: 1,
    color: authTheme.text,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  dangerText: {
    color: authTheme.error,
  },
  divider: {
    height: 1,
    backgroundColor: authTheme.cardBorder,
  },
});
