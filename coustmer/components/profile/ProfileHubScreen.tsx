import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Crown,
  FileText,
  GraduationCap,
  Heart,
  Headset,
  LogOut,
  MapPin,
  MoreVertical,
  RotateCcw,
  Ticket,
  TrainFront,
  Wallet,
  Zap,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { SmoothPressable } from '@/components/common/SmoothPressable';
import { APP_BOTTOM_NAV_INSET } from '@/components/navigation/AppBottomNav';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { usePaymentWallet } from '@/lib/payment/hooks';
import { useUserProfile } from '@/lib/profile/hooks';
import { useAuthStore } from '@/store/auth-store';

type Banner = { message: string; type: 'error' | 'success' } | null;

const HEADER_PEACH = '#FFF0E8';
const PAGE_BG = '#F4F4F5';
const TEXT = '#282C3F';
const TEXT_MUTED = '#686B78';
const BORDER = '#E9E9ED';

function formatPhone(raw?: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) {
    const local = digits.slice(-10);
    return `+91 - ${local}`;
  }
  return raw;
}

type QuickAction = {
  id: string;
  label: string;
  onPress: () => void;
  renderIcon: () => ReactNode;
};

type ListRow = {
  id: string;
  label: string;
  icon: typeof CreditCard;
  onPress: () => void;
  danger?: boolean;
};

function OneLogo() {
  return (
    <MaskedView
      style={styles.oneLogoMask}
      maskElement={
        <Text style={styles.oneLogoText} numberOfLines={1}>
          one
        </Text>
      }
    >
      <LinearGradient
        colors={['#FF5A41', '#E53935', '#C62828']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </MaskedView>
  );
}

function RefundIcon() {
  return (
    <View style={styles.refundIcon}>
      <CreditCard color={TEXT} size={20} strokeWidth={1.7} />
      <View style={styles.refundBadge}>
        <RotateCcw color={TEXT} size={10} strokeWidth={2.4} />
      </View>
    </View>
  );
}

function MoneyIcon() {
  return (
    <View style={styles.moneyIcon}>
      <Wallet color={TEXT} size={20} strokeWidth={1.7} />
      <View style={styles.moneyPlus}>
        <Text style={styles.moneyPlusText}>+</Text>
      </View>
    </View>
  );
}

function CreditZapIcon({ color }: { color: string }) {
  return (
    <View style={styles.creditZap}>
      <CreditCard color={color} size={20} strokeWidth={1.7} />
      <Zap
        color={color}
        size={11}
        strokeWidth={2.4}
        fill={color}
        style={styles.creditZapBolt}
      />
    </View>
  );
}

export function ProfileHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);

  const profile = useUserProfile();
  const wallet = usePaymentWallet();

  const [banner, setBanner] = useState<Banner>(null);
  const [action, setAction] = useState<'logout' | 'logoutAll' | null>(null);

  const user = profile.data;
  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    authUser?.firstName ||
    authUser?.email ||
    'User';
  const phone =
    formatPhone(user?.phone) ||
    formatPhone(authUser?.phone) ||
    user?.email ||
    authUser?.email ||
    '';

  const onRefresh = () => {
    profile.refetch();
    wallet.refetch();
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
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

  const quickActions: QuickAction[] = [
    {
      id: 'addresses',
      label: 'Saved Address',
      renderIcon: () => <MapPin color={TEXT} size={22} strokeWidth={1.7} />,
      onPress: () =>
        router.push('/profile/addresses' as import('expo-router').Href),
    },
    {
      id: 'payments',
      label: 'Payment Modes',
      renderIcon: () => <Wallet color={TEXT} size={22} strokeWidth={1.7} />,
      onPress: () => router.push('/payments' as import('expo-router').Href),
    },
    {
      id: 'refunds',
      label: 'My Refunds',
      renderIcon: () => <RefundIcon />,
      onPress: () => router.push('/payments' as import('expo-router').Href),
    },
    {
      id: 'money',
      label: 'Wallet Money',
      renderIcon: () => <MoneyIcon />,
      onPress: () => router.push('/profile/wallet'),
    },
  ];

  const listRows: ListRow[] = [
    {
      id: 'credit-card',
      label: 'HDFC Bank Credit Card',
      icon: CreditCard,
      onPress: () => router.push('/payments' as import('expo-router').Href),
    },
    {
      id: 'vouchers',
      label: 'My Vouchers',
      icon: Ticket,
      onPress: () => router.push('/deals' as import('expo-router').Href),
    },
    {
      id: 'statements',
      label: 'Account Statements',
      icon: FileText,
      onPress: () => router.push('/payments' as import('expo-router').Href),
    },
    {
      id: 'train',
      label: 'Order Food on Train',
      icon: TrainFront,
      onPress: () => router.push('/home' as import('expo-router').Href),
    },
    {
      id: 'corporate',
      label: 'Corporate Rewards',
      icon: Briefcase,
      onPress: () => router.push('/profile/referral'),
    },
    {
      id: 'student',
      label: 'Student Rewards',
      icon: GraduationCap,
      onPress: () => router.push('/profile/referral'),
    },
    {
      id: 'wishlist',
      label: 'My Wishlist',
      icon: Bookmark,
      onPress: () => router.push('/cart/saved' as import('expo-router').Href),
    },
    {
      id: 'favorites',
      label: 'Favourites',
      icon: Heart,
      onPress: () => router.push('/favorites' as import('expo-router').Href),
    },
    {
      id: 'partner',
      label: 'Partner Rewards',
      icon: Crown,
      onPress: () => router.push('/profile/referral'),
    },
    {
      id: 'contact-prefs',
      label: 'Allow restaurants to contact you',
      icon: Headset,
      onPress: () => router.push('/profile/preferences'),
    },
    {
      id: 'edit',
      label: 'Edit profile',
      icon: FileText,
      onPress: () => router.push('/profile/edit'),
    },
    {
      id: 'sessions',
      label: 'Active sessions',
      icon: CreditCard,
      onPress: () => router.push('/profile/sessions'),
    },
    {
      id: 'delete',
      label: 'Delete account',
      icon: LogOut,
      onPress: () =>
        router.push('/profile/delete-account' as import('expo-router').Href),
      danger: true,
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      onPress: handleLogout,
    },
    {
      id: 'logout-all',
      label: 'Logout from all devices',
      icon: LogOut,
      onPress: handleLogoutAll,
      danger: true,
    },
  ];

  if (profile.isLoading && !profile.data) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LoadingView label="Loading profile…" />
      </View>
    );
  }

  if (profile.isError) {
    return (
      <View style={[styles.root, styles.errorWrap, { paddingTop: insets.top }]}>
        <ErrorView
          message={
            profile.error instanceof Error
              ? profile.error.message
              : 'Failed to load profile'
          }
          onRetry={profile.refetch}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 110 + APP_BOTTOM_NAV_INSET },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefetching}
            onRefresh={onRefresh}
            tintColor={authTheme.brand}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <View style={styles.navRow}>
            <SmoothPressable
              onPress={goBack}
              style={styles.iconBtn}
              pressScale={0.9}
              hitSlop={8}
            >
              <ArrowLeft color={TEXT} size={22} strokeWidth={2} />
            </SmoothPressable>

            <View style={styles.navRight}>
              <SmoothPressable
                style={styles.helpBtn}
                onPress={() =>
                  router.push('/support' as import('expo-router').Href)
                }
                pressScale={0.96}
              >
                <Text style={styles.helpText}>Help</Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={() =>
                  router.push('/profile/edit' as import('expo-router').Href)
                }
                style={styles.iconBtn}
                pressScale={0.9}
                hitSlop={8}
              >
                <MoreVertical color={TEXT} size={20} strokeWidth={2} />
              </SmoothPressable>
            </View>
          </View>

          <Text style={styles.name}>{displayName}</Text>
          {phone ? <Text style={styles.phone}>{phone}</Text> : null}
        </View>

        <View style={styles.body}>
          {banner ? (
            <View style={styles.bannerWrap}>
              <AuthMessageBanner message={banner.message} type={banner.type} />
            </View>
          ) : null}

          <Pressable
            style={styles.oneCard}
            onPress={() => router.push('/deals' as import('expo-router').Href)}
          >
            <View style={styles.oneTop}>
              <OneLogo />
              <View style={styles.joinPill}>
                <Text style={styles.joinText}>JOIN NOW</Text>
              </View>
            </View>
            <View style={styles.oneBody}>
              <View style={styles.oneCopy}>
                <Text style={styles.oneTitle}>
                  Unlimited free deliveries, extra discounts & more!
                </Text>
                <Text style={styles.oneSub}>
                  Join now to unlock exclusive benefits
                </Text>
              </View>
              <ChevronDown color="#B0B0B8" size={20} strokeWidth={2} />
            </View>
          </Pressable>

          <View style={styles.quickRow}>
            {quickActions.map((item) => (
              <Pressable
                key={item.id}
                style={styles.quickCard}
                onPress={item.onPress}
              >
                {item.renderIcon()}
                <Text style={styles.quickLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.listCard}>
            {listRows.map((row, index) => {
              const Icon = row.icon;
              const busy =
                (row.id === 'logout' && action === 'logout') ||
                (row.id === 'logout-all' && action === 'logoutAll');
              const iconColor = row.danger ? authTheme.error : TEXT;

              return (
                <View key={row.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable style={styles.listRow} onPress={row.onPress}>
                    {row.id === 'credit-card' ? (
                      <CreditZapIcon color={iconColor} />
                    ) : (
                      <Icon color={iconColor} size={20} strokeWidth={1.7} />
                    )}
                    <Text
                      style={[
                        styles.listLabel,
                        row.danger && styles.listLabelDanger,
                      ]}
                      numberOfLines={2}
                    >
                      {row.label}
                    </Text>
                    {busy ? (
                      <ActivityIndicator
                        color={row.danger ? authTheme.error : TEXT_MUTED}
                        size="small"
                      />
                    ) : (
                      <ChevronRight
                        color="#C8C8CE"
                        size={18}
                        strokeWidth={2}
                      />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.fabWrap, { bottom: 18 + APP_BOTTOM_NAV_INSET }]}
        pointerEvents="box-none"
      >
        <SmoothPressable
          style={styles.fab}
          onPress={() => router.push('/orders' as import('expo-router').Href)}
          pressScale={0.97}
        >
          <Text style={styles.fabText}>BROWSE PAST ORDERS</Text>
        </SmoothPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  errorWrap: {
    padding: 20,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: HEADER_PEACH,
    paddingHorizontal: 18,
    paddingBottom: 72,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtn: {
    borderWidth: 1,
    borderColor: authTheme.brand,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  helpText: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: authTheme.brand,
  },
  name: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: TEXT,
    letterSpacing: -0.4,
  },
  phone: {
    marginTop: 6,
    fontFamily: fonts.ui,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  body: {
    paddingHorizontal: 16,
    marginTop: -32,
  },
  bannerWrap: {
    marginBottom: 12,
  },
  oneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 12,
  },
  oneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  oneLogoMask: {
    height: 28,
    width: 52,
  },
  oneLogoText: {
    fontFamily: fonts.script,
    fontSize: 26,
    color: '#000',
    lineHeight: 28,
  },
  joinPill: {
    backgroundColor: '#E53935',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  joinText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  oneBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oneCopy: {
    flex: 1,
  },
  oneTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: TEXT,
    lineHeight: 21,
  },
  oneSub: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 12.5,
    color: TEXT_MUTED,
    lineHeight: 17,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    gap: 10,
    minHeight: 92,
  },
  quickLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 11.5,
    color: TEXT,
    lineHeight: 15,
  },
  refundIcon: {
    width: 24,
    height: 22,
    justifyContent: 'center',
  },
  refundBadge: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  moneyIcon: {
    width: 24,
    height: 22,
    justifyContent: 'center',
  },
  moneyPlus: {
    position: 'absolute',
    right: -3,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyPlusText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: TEXT,
    lineHeight: 12,
  },
  creditZap: {
    width: 24,
    height: 22,
    justifyContent: 'center',
  },
  creditZapBolt: {
    position: 'absolute',
    right: -1,
    top: 0,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFEFF2',
    marginLeft: 50,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    paddingHorizontal: 16,
    gap: 14,
  },
  listLabel: {
    flex: 1,
    fontFamily: fonts.uiMedium,
    fontSize: 15,
    color: TEXT,
  },
  listLabelDanger: {
    color: authTheme.error,
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: '#000000',
    borderRadius: 999,
    paddingHorizontal: 30,
    paddingVertical: 15,
    minWidth: 230,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.9,
  },
});
