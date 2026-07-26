import { useRouter } from 'expo-router';
import { ChevronRight, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';
import { useCartStore } from '@/store/cart-store';

type Props = {
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
        { paddingBottom: Math.max(insets.bottom, 10) + bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.bar}
        onPress={() => router.push('/cart')}
        accessibilityRole="button"
        accessibilityLabel="View cart"
      >
        <View style={styles.countPill}>
          <ShoppingBag color="#FFFFFF" size={15} strokeWidth={2.4} />
          <Text style={styles.countText}>{totalItems}</Text>
        </View>
        <View style={styles.mid}>
          <Text style={styles.title} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={styles.sub}>
            {totalItems} item{totalItems === 1 ? '' : 's'} · ₹{subtotal.toFixed(0)}
          </Text>
        </View>
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>VIEW CART</Text>
          <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.6} />
        </View>
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
    backgroundColor: ui.green,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    marginTop: 1,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cta: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
