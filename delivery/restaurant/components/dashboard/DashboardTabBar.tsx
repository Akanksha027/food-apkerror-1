import {
  ClipboardList,
  Home,
  Plus,
  Settings,
  UtensilsCrossed,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export type DashboardTab = 'stats' | 'orders' | 'menu' | 'admin';

type TabItem = {
  key: DashboardTab;
  label: string;
  icon: typeof Home;
  href: '/dashboard' | '/orders' | '/menu' | '/admin';
};

const tabs: TabItem[] = [
  { key: 'stats', label: 'Home', icon: Home, href: '/dashboard' },
  { key: 'orders', label: 'Orders', icon: ClipboardList, href: '/orders' },
  { key: 'menu', label: 'Menu', icon: UtensilsCrossed, href: '/menu' },
  { key: 'admin', label: 'Admin', icon: Settings, href: '/admin' },
];

type Props = {
  active: DashboardTab;
  onNavigate: (href: TabItem['href']) => void;
  onCenterPress?: () => void;
  centerBadge?: number;
};

const ICON_IDLE = '#9A4A58';

export function DashboardTabBar({
  active,
  onNavigate,
  onCenterPress,
  centerBadge = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  const renderTab = (tab: TabItem) => {
    const Icon = tab.icon;
    const isActive = tab.key === active;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onNavigate(tab.href)}
        style={({ pressed }) => [styles.sideTab, pressed && styles.pressedTab]}
      >
        <Icon
          color={isActive ? authTheme.brand : ICON_IDLE}
          size={22}
          strokeWidth={isActive ? 2.4 : 1.9}
          fill={isActive && tab.key === 'stats' ? authTheme.brand : 'transparent'}
        />
        {isActive ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
        <Text
          style={[
            styles.tabLabel,
            { color: isActive ? authTheme.brand : ICON_IDLE },
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.barOuter}>
        <View style={styles.bar}>
          <View style={styles.sideGroup}>{left.map(renderTab)}</View>

          <View style={styles.centerSlot}>
            <View style={styles.glowOuter} />
            <View style={styles.glowInner} />
            <Pressable
              onPress={onCenterPress}
              style={({ pressed }) => [styles.centerBtn, pressed && styles.pressedCenter]}
            >
              <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
              {centerBadge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {centerBadge > 9 ? '9+' : String(centerBadge)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.sideGroup}>{right.map(renderTab)}</View>
        </View>
      </View>
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
    width: '90%',
    maxWidth: 400,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 250, 247, 0.96)',
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 70,
    borderWidth: 1,
    borderColor: 'rgba(122, 14, 34, 0.08)',
    shadowColor: '#7A0E22',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 18,
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
    minWidth: 48,
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
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
    marginTop: -32,
  },
  glowOuter: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255, 107, 53, 0.16)',
  },
  glowInner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(122, 14, 34, 0.18)',
  },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: authTheme.foodAccent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.extraBold,
  },
  pressedTab: {
    opacity: 0.75,
    transform: [{ scale: 0.92 }],
  },
  pressedCenter: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
  },
});
