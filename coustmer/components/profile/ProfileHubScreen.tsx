import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bell,
  Bookmark,
  CreditCard,
  Gift,
  KeyRound,
  LogOut,
  Mail,
  Package,
  Shield,
  Smartphone,
  Trash2,
  User,
  UserPen,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { APP_BOTTOM_NAV_INSET } from '@/components/navigation/AppBottomNav';
import { ProfileMenuItem } from '@/components/profile/ProfileMenuItem';
import { ProfileMenuSection } from '@/components/profile/ProfileMenuSection';
import { authTheme } from '@/constants/auth-theme';
import { useUserProfile } from '@/lib/profile/hooks';
import { usePaymentWallet } from '@/lib/payment/hooks';
import { useAuthStore } from '@/store/auth-store';

type Banner = { message: string; type: 'error' | 'success' } | null;

export function ProfileHubScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const resendEmailVerification = useAuthStore((s) => s.resendEmailVerification);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const profile = useUserProfile();
  const wallet = usePaymentWallet();

  const [banner, setBanner] = useState<Banner>(null);
  const [action, setAction] = useState<'logout' | 'logoutAll' | 'resend' | null>(
    null
  );

  const user = profile.data;
  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    authUser?.firstName ||
    authUser?.email ||
    'User';

  const onRefresh = () => {
    profile.refetch();
    wallet.refetch();
  };

  const handleLogout = async () => {
    setAction('logout');
    setBanner(null);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      setBanner({
        message: error instanceof Error ? error.message : 'Logout failed',
        type: 'error',
      });
    } finally {
      setAction(null);
    }
  };

  const handleLogoutAll = async () => {
    setAction('logoutAll');
    setBanner(null);
    try {
      await logoutAll();
      router.replace('/login');
    } catch (error) {
      setBanner({
        message: error instanceof Error ? error.message : 'Logout failed',
        type: 'error',
      });
    } finally {
      setAction(null);
    }
  };

  const handleResendVerification = async () => {
    setAction('resend');
    setBanner(null);
    try {
      const message = await resendEmailVerification();
      setBanner({ message, type: 'success' });
    } catch (error) {
      setBanner({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to resend verification email',
        type: 'error',
      });
    } finally {
      setAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {profile.isLoading && !profile.data ? (
        <LoadingView label="Loading profile…" />
      ) : profile.isError ? (
        <View style={styles.errorWrap}>
          <ErrorView
            message={
              profile.error instanceof Error
                ? profile.error.message
                : 'Failed to load profile'
            }
            onRetry={profile.refetch}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={profile.isRefetching}
              onRefresh={onRefresh}
              tintColor={authTheme.brand}
            />
          }
        >
          <LinearGradient
            colors={['#7A0E22', '#5A0A18']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.avatarWrap}>
              {user?.profilePhotoUrl ? (
                <Image
                  source={{ uri: user.profilePhotoUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User color="#FFFFFF" size={36} />
                </View>
              )}
            </View>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroEmail}>{user?.email ?? authUser?.email}</Text>
            {user?.phone ? (
              <Text style={styles.heroPhone}>{user.phone}</Text>
            ) : null}
            {wallet.data ? (
              <View style={styles.walletPill}>
                <Wallet color="#FFFFFF" size={14} />
                <Text style={styles.walletText}>
                  ₹{wallet.data.balance.toFixed(0)} {wallet.data.currency}
                </Text>
              </View>
            ) : null}
          </LinearGradient>

          <View style={styles.content}>
            {banner ? (
              <AuthMessageBanner message={banner.message} type={banner.type} />
            ) : null}

          {!user?.isEmailVerified && !authUser?.emailVerified ? (
            <View style={styles.verifyBanner}>
              <Mail color={authTheme.brand} size={20} />
              <View style={styles.verifyText}>
                <Text style={styles.verifyTitle}>Verify your email</Text>
                <Text style={styles.verifySubtitle}>
                  Check your inbox or resend the verification link.
                </Text>
              </View>
              <Pressable
                onPress={handleResendVerification}
                disabled={isAuthLoading}
                style={styles.verifyButton}
              >
                {action === 'resend' ? (
                  <ActivityIndicator color={authTheme.brand} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Resend</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <ProfileMenuSection title="Account">
            <ProfileMenuItem
              icon={Bell}
              label="Notifications"
              subtitle="Order updates, offers & alerts"
              onPress={() =>
                router.push({ pathname: '/notifications' } as import('expo-router').Href)
              }
              color="#7A0E22"
            />
            <ProfileMenuItem
              icon={Package}
              label="My orders"
              subtitle="Active, scheduled & history"
              onPress={() => router.push('/orders' as import('expo-router').Href)}
              color="#EA580C"
            />
            <ProfileMenuItem
              icon={Bookmark}
              label="Saved carts"
              subtitle="Restore carts you saved for later"
              onPress={() => router.push('/cart/saved' as import('expo-router').Href)}
              color="#7C3AED"
            />
            <ProfileMenuItem
              icon={UserPen}
              label="Edit profile"
              subtitle="Name, gender, date of birth"
              onPress={() => router.push('/profile/edit')}
            />
            <ProfileMenuItem
              icon={Mail}
              label="Phone & email"
              subtitle="Update contact details"
              onPress={() => router.push('/profile/contact')}
              color="#0891B2"
            />
            <ProfileMenuItem
              icon={Wallet}
              label="Wallet"
              subtitle={
                wallet.data
                  ? `Balance ₹${wallet.data.balance.toFixed(0)}`
                  : 'Add money & view transactions'
              }
              onPress={() => router.push('/profile/wallet')}
              color="#16A34A"
            />
            <ProfileMenuItem
              icon={CreditCard}
              label="Payments"
              subtitle="History, cards & UPI"
              onPress={() => router.push('/payments' as import('expo-router').Href)}
              color="#2563EB"
            />
            <ProfileMenuItem
              icon={Gift}
              label="Refer & earn"
              subtitle="Share your referral code"
              onPress={() => router.push('/profile/referral')}
              color="#DB2777"
            />
          </ProfileMenuSection>

          <ProfileMenuSection title="Preferences">
            <ProfileMenuItem
              icon={Bell}
              label="Notification settings"
              subtitle="Push, email & dietary preferences"
              onPress={() => router.push('/profile/preferences')}
              color="#D97706"
            />
          </ProfileMenuSection>

          <ProfileMenuSection title="Security">
            <ProfileMenuItem
              icon={KeyRound}
              label="Change password"
              onPress={() => router.push('/change-password')}
            />
            <ProfileMenuItem
              icon={Shield}
              label="Active sessions"
              subtitle="Manage logged-in devices"
              onPress={() => router.push('/profile/sessions')}
              color="#6366F1"
            />
            <ProfileMenuItem
              icon={Smartphone}
              label="Push devices"
              subtitle="Register for notifications"
              onPress={() => router.push('/profile/devices')}
              color="#0EA5E9"
            />
            <ProfileMenuItem
              icon={LogOut}
              label="Logout"
              onPress={handleLogout}
              trailing={
                action === 'logout' ? (
                  <ActivityIndicator color={authTheme.textMuted} size="small" />
                ) : undefined
              }
            />
            <ProfileMenuItem
              icon={Shield}
              label="Logout from all devices"
              onPress={handleLogoutAll}
              color={authTheme.error}
              danger
              trailing={
                action === 'logoutAll' ? (
                  <ActivityIndicator color={authTheme.error} size="small" />
                ) : undefined
              }
            />
          </ProfileMenuSection>

          <ProfileMenuSection title="Danger zone">
            <ProfileMenuItem
              icon={Trash2}
              label="Delete account"
              subtitle="Permanently remove your account"
              onPress={() => router.push('/profile/delete-account')}
              color={authTheme.error}
              danger
            />
          </ProfileMenuSection>

          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back to Home</Text>
          </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  scroll: {
    paddingBottom: 40 + APP_BOTTOM_NAV_INSET,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  errorWrap: {
    flex: 1,
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },
  heroPhone: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  walletText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerWrap: {
    marginBottom: 16,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: authTheme.brandSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.brandMuted,
    padding: 14,
  },
  verifyText: {
    flex: 1,
  },
  verifyTitle: {
    color: authTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  verifySubtitle: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  verifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verifyButtonText: {
    color: authTheme.brand,
    fontSize: 13,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    color: authTheme.brand,
    fontSize: 14,
    fontWeight: '600',
  },
});
