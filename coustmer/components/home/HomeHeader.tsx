import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import {
  Bell,
  ChevronDown,
  MapPin,
  Mic,
  Package,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { useUnreadNotificationCount } from '@/lib/notification/hooks';
import { useCartStore } from '@/store/cart-store';

type HeaderProps = {
  greeting: string;
  tier?: string;
  loyaltyPoints?: number;
  topInset?: number;
  deliveryTitle?: string;
  deliverySubtitle?: string;
  deliveryLine?: string;
  isDetectingLocation?: boolean;
  onLocationPress?: () => void;
  /** When false, search lives in the sticky chrome instead. */
  showSearch?: boolean;
};

const SEARCH_HINTS = [
  'Search for “biryani”',
  'Search for “pizza”',
  'Search for “Molecule”',
  'Search for restaurants',
  'Search for dishes',
  'Search for “burger”',
];

export function HomeSearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex((i) => (i + 1) % SEARCH_HINTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <Pressable
      style={[styles.searchBar, compact && styles.searchBarCompact]}
      onPress={() => router.push('/search')}
      accessibilityRole="search"
      accessibilityLabel="Search for restaurants and dishes"
    >
      <Search color={authTheme.brand} size={18} strokeWidth={2.4} />
      <View style={styles.searchCopy}>
        <Text style={styles.searchPlaceholder} numberOfLines={1}>
          {SEARCH_HINTS[hintIndex]}
        </Text>
      </View>
      <View style={styles.micWrap}>
        <Mic color={authTheme.brand} size={18} />
      </View>
    </Pressable>
  );
}

export function HomeHeader({
  greeting,
  tier,
  loyaltyPoints,
  topInset = 0,
  deliveryTitle,
  deliverySubtitle,
  deliveryLine = 'Set delivery address',
  isDetectingLocation = false,
  onLocationPress,
  showSearch = true,
}: HeaderProps) {
  const router = useRouter();
  const cartCount = useCartStore((s) => s.totalItems());
  const unreadNotifications = useUnreadNotificationCount({
    refetchInterval: 12_000,
  });
  const unreadCount = unreadNotifications.data ?? 0;
  const title = deliveryTitle || deliveryLine;
  const subtitle = deliverySubtitle?.trim() || '';

  return (
    <LinearGradient
      colors={['#7A0E22', '#5A0A18']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: topInset + 12 }]}
    >
      <View style={styles.topRow}>
        <Pressable
          style={styles.locationWrap}
          hitSlop={6}
          onPress={onLocationPress ?? (() => {})}
        >
          <View style={styles.pinCircle}>
            <MapPin color="#FFFFFF" size={16} />
          </View>
          <View style={styles.locationTextWrap}>
            <View style={styles.locationLabelRow}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <ChevronDown color="rgba(255,255,255,0.85)" size={13} />
            </View>
            {isDetectingLocation ? (
              <Text style={styles.locationValue} numberOfLines={1}>
                Detecting your location…
              </Text>
            ) : (
              <>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.locationSubtitle} numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </Pressable>

        <View style={styles.rightActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push({ pathname: '/notifications' } as Href)
            }
            accessibilityLabel="Notifications"
          >
            <Bell color="#FFFFFF" size={18} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/orders' as Href)}>
            <Package color="#FFFFFF" size={18} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/cart')}>
            <ShoppingBag color="#FFFFFF" size={18} />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
            <User color="#FFFFFF" size={20} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.greeting}>Hey {greeting} 👋</Text>
      <Text style={styles.tagline}>What are you craving today?</Text>

      {showSearch ? <HomeSearchBar /> : null}

      {tier ? (
        <View style={styles.loyaltyRow}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{tier.toUpperCase()} MEMBER</Text>
          </View>
          <Text style={styles.pointsText}>
            {loyaltyPoints ?? 0} loyalty points
          </Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  locationTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  locationSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginTop: 20,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBarCompact: {
    marginTop: 0,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchPlaceholder: {
    color: authTheme.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  searchCopy: {
    flex: 1,
    minWidth: 0,
  },
  micWrap: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 10,
  },
  loyaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
});
