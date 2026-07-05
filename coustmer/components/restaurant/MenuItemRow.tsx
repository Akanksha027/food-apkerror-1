import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PriceTag, VegBadge } from '@/components/restaurant/MenuBadges';
import { authTheme } from '@/constants/auth-theme';
import type { MenuItem } from '@/lib/restaurant/types';

type Props = {
  item: MenuItem;
  onPress?: () => void;
};

export function MenuItemRow({ item, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <VegBadge isVeg={item.isVeg} />
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
        <PriceTag price={item.price} />
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        {!item.isAvailable ? (
          <Text style={styles.unavailable}>Currently unavailable</Text>
        ) : null}
      </View>

      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.imagePlaceholder} />
        )}
        {item.isAvailable ? (
          <Pressable style={styles.addButton}>
            <Plus color={authTheme.brand} size={18} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: authTheme.cardBorder,
  },
  textWrap: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  desc: {
    color: authTheme.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  unavailable: {
    color: authTheme.error,
    fontSize: 12,
    fontWeight: '600',
  },
  imageWrap: {
    width: 118,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: authTheme.input,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    position: 'absolute',
    bottom: -1,
    alignSelf: 'center',
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
