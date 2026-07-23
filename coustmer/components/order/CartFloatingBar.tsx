import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { useCartStore } from '@/store/cart-store';

type Props = {
  /** Extra bottom offset when stacked above another bar */
  bottomOffset?: number;
};

export function CartFloatingBar({ bottomOffset = 0 }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const restaurant = useCartStore((s) => s.restaurant);
  const totalItems = useCartStore((s) => s.totalItems());
  const subtotal = useCartStore((s) => s.subtotal());

  if (!items.length || !restaurant) return null;

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 12) + bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.bar}
        onPress={() => router.push('/cart')}
      >
        <View style={styles.left}>
          <View style={styles.badge}>
            <ShoppingBag color="#FFFFFF" size={16} />
            <Text style={styles.badgeCount}>{totalItems}</Text>
          </View>
          <View>
            <Text style={styles.title} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <Text style={styles.subtitle}>
              {totalItems} item{totalItems === 1 ? '' : 's'} · ₹{subtotal.toFixed(0)}
            </Text>
          </View>
        </View>
        <Text style={styles.cta}>View cart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: authTheme.brand,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeCount: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 1,
  },
  cta: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
});
