import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import {
  Compass,
  Home,
  RotateCcw,
  ShoppingBag,
  UserRound,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { homeCategoriesPinnedSV } from '@/lib/home/pin-shared';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';

/** Space to leave above the floating tab bar on root tab screens. */
export const APP_BOTTOM_NAV_INSET = 92;

const ICON_IDLE = '#9A4A58';
const ICON_ACTIVE = authTheme.brand;

type SideTab = {
  key: 'home' | 'food' | 'reorder' | 'account';
  label: string;
  href: Href;
  match: (pathname: string) => boolean;
  Icon: typeof Home;
  filledWhenActive?: boolean;
};

const SIDE_TABS: SideTab[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/home',
    match: (p) => p === '/home' || p.endsWith('/home'),
    Icon: Home,
    filledWhenActive: true,
  },
  {
    key: 'food',
    label: 'Food',
    href: '/restaurants',
    match: (p) => p === '/restaurants' || /\/restaurants\/?$/.test(p),
    Icon: Compass,
  },
  {
    key: 'reorder',
    label: 'Orders',
    href: '/orders',
    match: (p) => p === '/orders' || p.endsWith('/orders'),
    Icon: RotateCcw,
  },
  {
    key: 'account',
    label: 'Account',
    href: '/profile',
    match: (p) => p === '/profile' || p.endsWith('/profile'),
    Icon: UserRound,
  },
];

function isCartPath(pathname: string) {
  return pathname === '/cart' || pathname.endsWith('/cart');
}

function isHomePath(pathname: string) {
  return pathname === '/home' || pathname.endsWith('/home');
}

export function isAppTabRoot(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return isCartPath(path) || SIDE_TABS.some((tab) => tab.match(path));
}

export function AppBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.totalItems());
  const homeCategoriesPinned = useUiStore((s) => s.homeCategoriesPinned);

  const path = pathname.split('?')[0] ?? pathname;
  const onHome = isHomePath(path);
  const onTabRoot = isAppTabRoot(path);

  const homePinStyle = useAnimatedStyle(() => {
    const show = homeCategoriesPinnedSV.value;
    return {
      opacity: show,
      transform: [{ translateY: (1 - show) * 16 }],
    };
  });

  if (!onTabRoot) return null;

  const cartActive = isCartPath(path);
  const leftTabs = SIDE_TABS.slice(0, 2);
  const rightTabs = SIDE_TABS.slice(2);

  const go = (href: Href, alreadyActive: boolean) => {
    if (alreadyActive) return;
    router.replace(href);
  };

  const renderSideTab = (tab: SideTab) => {
    const active = tab.match(path);
    const Icon = tab.Icon;

    return (
      <Pressable
        key={tab.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}
        hitSlop={8}
        onPress={() => go(tab.href, active)}
        style={styles.sideTab}
      >
        <Icon
          color={active ? ICON_ACTIVE : ICON_IDLE}
          size={22}
          strokeWidth={active ? 2.4 : 1.9}
          fill={active && tab.filledWhenActive ? ICON_ACTIVE : 'transparent'}
        />
        {active ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
      </Pressable>
    );
  };

  const bar = (
    <View style={styles.barOuter}>
      <View style={styles.bar}>
        <View style={styles.sideGroup}>{leftTabs.map(renderSideTab)}</View>

        <View style={styles.centerSlot}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: cartActive }}
            accessibilityLabel="Cart"
            onPress={() => go('/cart', cartActive)}
            style={[styles.centerBtn, cartActive && styles.centerBtnActive]}
          >
            <ShoppingBag color="#FFFFFF" size={22} strokeWidth={2.25} />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 9 ? '9+' : String(cartCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.sideGroup}>{rightTabs.map(renderSideTab)}</View>
      </View>
    </View>
  );

  if (onHome) {
    return (
      <Animated.View
        pointerEvents={homeCategoriesPinned ? 'box-none' : 'none'}
        style={[
          styles.wrap,
          { paddingBottom: Math.max(insets.bottom, 12) },
          homePinStyle,
        ]}
      >
        {bar}
      </Animated.View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
  },
  barOuter: {
    width: '88%',
    maxWidth: 380,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#7A0E22',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 16,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  sideTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    paddingVertical: 6,
    gap: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: authTheme.brand,
  },
  dotSpacer: {
    width: 5,
    height: 5,
  },
  centerSlot: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  glowOuter: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(122, 14, 34, 0.12)',
  },
  glowInner: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(122, 14, 34, 0.18)',
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#7A0E22',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  centerBtnActive: {
    backgroundColor: authTheme.brandDark,
    transform: [{ scale: 1.04 }],
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
