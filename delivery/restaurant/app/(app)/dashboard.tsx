import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bike,
  ChefHat,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LogOut,
  MailCheck,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { heroGradient, theme } from '@/constants/theme';
import { restaurantOwnerApi } from '@/lib/restaurant/api';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const resendEmailVerification = useAuthStore((s) => s.resendEmailVerification);

  const [banner, setBanner] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  const isDelivery = user?.role === 'delivery';
  const [checkingRestaurant, setCheckingRestaurant] = useState(!isDelivery);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const RoleIcon = isDelivery ? Bike : ChefHat;
  const roleLabel = isDelivery ? 'Delivery Partner' : 'Restaurant Partner';
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Partner';

  useEffect(() => {
    if (!user || isDelivery) return;
    let active = true;
    setCheckingRestaurant(true);
    restaurantOwnerApi
      .getMyRestaurant()
      .then((my) => {
        if (!active) return;
        setNeedsProfileSetup(!my);
      })
      .catch(() => {
        if (!active) return;
        setNeedsProfileSetup(false);
      })
      .finally(() => {
        if (!active) return;
        setCheckingRestaurant(false);
      });
    return () => {
      active = false;
    };
  }, [user, isDelivery]);

  if (checkingRestaurant && !isDelivery) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const handleResendVerification = async () => {
    setBanner(null);
    try {
      const message = await resendEmailVerification();
      setBanner({ type: 'success', message });
    } catch (err) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to resend email',
      });
    }
  };

  const confirmLogout = (all: boolean) => {
    Alert.alert(
      all ? 'Log out everywhere?' : 'Log out?',
      all
        ? 'This will end your session on all devices.'
        : 'You will need to sign in again.',
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

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-b-[32px] px-6 pb-8 pt-6"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <RoleIcon color="#FFFFFF" size={28} />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  {roleLabel}
                </Text>
                <Text className="text-xl font-extrabold text-white">
                  {displayName}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => confirmLogout(false)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <LogOut color="#FFFFFF" size={20} />
            </Pressable>
          </View>

          <View className="mt-5 flex-row items-center gap-2 rounded-2xl bg-white/15 px-4 py-3">
            <MailCheck color="#FFFFFF" size={18} />
            <Text className="flex-1 text-sm text-white">{user?.email}</Text>
            <View
              className={`rounded-full px-2.5 py-1 ${
                user?.emailVerified ? 'bg-white' : 'bg-white/25'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  user?.emailVerified ? 'text-primary' : 'text-white'
                }`}
              >
                {user?.emailVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View className="px-6">
          {banner ? (
            <View className="mt-5">
              <AuthBanner type={banner.type} message={banner.message} />
            </View>
          ) : null}

          {needsProfileSetup ? (
            <Pressable
              onPress={() => router.push('/restaurant-setup')}
              className="mt-5 overflow-hidden rounded-2xl border border-primary/20 bg-white"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <View className="flex-row items-center gap-3 p-4">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Store color="#FFFFFF" size={22} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-secondary">
                    Complete restaurant profile
                  </Text>
                  <Text className="mt-0.5 text-sm text-secondary-light">
                    Add logo, address, and location to go live.
                  </Text>
                </View>
                <ChevronRight color={theme.primary} size={20} />
              </View>
            </Pressable>
          ) : null}

          <Text className="mb-3 mt-6 text-base font-bold text-secondary">
            {isDelivery ? 'Deliveries' : 'Operations'}
          </Text>
          <View className="gap-3">
            <FeatureCard
              icon={ClipboardList}
              title={isDelivery ? 'Assigned Orders' : 'Live Orders'}
              subtitle={
                isDelivery
                  ? 'Accept and complete deliveries'
                  : 'View and update incoming orders'
              }
            />
            <FeatureCard
              icon={isDelivery ? Wallet : Settings}
              title={isDelivery ? 'Earnings' : 'Menu Management'}
              subtitle={
                isDelivery
                  ? 'Track your payouts and trips'
                  : 'Add items, set prices & availability'
              }
            />
          </View>

          <Text className="mb-3 mt-7 text-base font-bold text-secondary">
            Account & security
          </Text>
          <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <AccountRow
              icon={KeyRound}
              label="Change password"
              onPress={() => router.push('/change-password')}
            />
            <Divider />
            <AccountRow
              icon={MailCheck}
              label="Resend email verification"
              onPress={handleResendVerification}
            />
            <Divider />
            <AccountRow
              icon={MonitorSmartphone}
              label="Log out all devices"
              onPress={() => confirmLogout(true)}
            />
            <Divider />
            <AccountRow
              icon={LogOut}
              label="Log out"
              danger
              onPress={() => confirmLogout(false)}
            />
          </View>

          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <ShieldCheck color={theme.secondaryLight} size={14} />
            <Text className="text-xs text-secondary-light">
              Secured partner session
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof ClipboardList;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4">
      <View className="mb-2 flex-row items-center gap-2.5">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon color={theme.primary} size={20} />
        </View>
        <Text className="text-base font-bold text-secondary">{title}</Text>
      </View>
      <Text className="text-sm text-secondary-light">{subtitle}</Text>
    </View>
  );
}

function AccountRow({
  icon: Icon,
  label,
  onPress,
  danger,
}: {
  icon: typeof KeyRound;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-4 active:bg-gray-50"
    >
      <Icon color={danger ? theme.danger : theme.secondary} size={20} />
      <Text
        className={`flex-1 text-sm font-semibold ${
          danger ? 'text-danger' : 'text-secondary'
        }`}
      >
        {label}
      </Text>
      <ChevronRight color={theme.muted} size={18} />
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100" />;
}
