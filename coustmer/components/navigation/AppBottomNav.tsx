import { Pressable } from '@/components/common/Pressable';
import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import {
  ClipboardList,
  Heart,
  Home,
  ShoppingBag,
  UserRound,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { useCartStore } from '@/store/cart-store';

/** Space to leave above the floating tab bar on root tab screens. */
export const APP_BOTTOM_NAV_INSET = 98;

const ICON_IDLE = '#9CA3AF';
const ICON_ACTIVE = authTheme.brand;

type SideTab = {
  key: 'home' | 'saved' | 'orders' | 'profile';
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
    key: 'profile',
    label: 'Profile',
    href: '/profile',
    match: (p) => p === '/profile' || p.endsWith('/profile'),
    Icon: UserRound,
    filledWhenActive: true,
  },
];

function isCartPath(pathname: string) {
  return pathname === '/cart' || pathname.endsWith('/cart');
}

function isFavoritesPath(pathname: string) {
  return pathname === '/favorites' || pathname.endsWith('/favorites');
}

function isRestaurantsPath(pathname: string) {
  return pathname === '/restaurants' || /\/restaurants\/?$/.test(pathname);
}

export function isAppTabRoot(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  if (isFavoritesPath(path) || isCartPath(path)) return false;
  return (
    isRestaurantsPath(path) || SIDE_TABS.some((tab) => tab.match(path))
  );
}

export function AppBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.totalItems());

  const path = pathname.split('?')[0] ?? pathname;
  const onTabRoot = isAppTabRoot(path);

  if (!onTabRoot) return null;

  const cartActive = isCartPath(path);
  const leftTabs = SIDE_TABS.slice(0, 1);
  const rightTabs = SIDE_TABS.slice(1);

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
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
      </Pressable>
    );
  };

  const bar = (
    <View style={styles.barOuter}>
      <View style={styles.bar}>
        <View style={styles.sideGroup}>{leftTabs.map(renderSideTab)}</View>

        <View style={styles.centerSlot}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: cartActive }}
            accessibilityLabel="Cart"
            onPress={() => go('/cart', cartActive)}
            style={[styles.centerBtn, cartActive && styles.centerBtnActive]}
          >
            <ShoppingBag color={ICON_ACTIVE} size={22} strokeWidth={2.25} />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 9 ? '9+' : String(cartCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Text style={[styles.tabLabel, cartActive && styles.tabLabelActive]}>Cart</Text>
        </View>

        <View style={styles.sideGroup}>{rightTabs.map(renderSideTab)}</View>
      </View>
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
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
    width: 240,
    maxWidth: '75%',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 14,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flex: 1,
  },
  sideTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    paddingVertical: 2,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ICON_IDLE,
  },
  tabLabelActive: {
    color: ICON_ACTIVE,
    fontWeight: '800',
  },
  centerSlot: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: -28,
  },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: authTheme.brand,
  },
  centerBtnActive: {
    backgroundColor: '#F9FAFB',
    transform: [{ scale: 1.03 }],
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: authTheme.brandLight,
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
