import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

export function VegBadge({ isVeg }: { isVeg?: boolean }) {
  if (isVeg === undefined) return null;

  return (
    <View style={[styles.badge, isVeg ? styles.veg : styles.nonVeg]}>
      <View style={[styles.dot, isVeg ? styles.vegDot : styles.nonVegDot]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  veg: {
    borderColor: '#16A34A',
  },
  nonVeg: {
    borderColor: '#DC2626',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  vegDot: {
    backgroundColor: '#16A34A',
  },
  nonVegDot: {
    backgroundColor: '#DC2626',
  },
});

export function PriceTag({ price }: { price: number }) {
  return <Text style={priceStyles.text}>₹{price.toFixed(0)}</Text>;
}

const priceStyles = StyleSheet.create({
  text: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
