import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { PriceTag, VegBadge } from '@/components/restaurant/MenuBadges';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { authTheme } from '@/constants/auth-theme';
import { useMenuItem } from '@/lib/restaurant/hooks';

export function MenuItemDetailScreen() {
  const { restaurantId, itemId } = useLocalSearchParams<{
    restaurantId: string;
    itemId: string;
  }>();

  const { data: item, isLoading, isError, error, refetch } = useMenuItem(
    String(restaurantId ?? ''),
    String(itemId ?? '')
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Dish details" />

        {isLoading ? (
          <LoadingView label="Loading dish…" />
        ) : isError || !item ? (
          <ErrorView
            message={error instanceof Error ? error.message : 'Item not found'}
            onRetry={refetch}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.imageWrap}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
              ) : (
                <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.image} />
              )}
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <VegBadge isVeg={item.isVeg} />
                <Text style={styles.name}>{item.name}</Text>
              </View>
              <PriceTag price={item.price} />
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
              {item.categoryName ? (
                <Text style={styles.category}>{item.categoryName}</Text>
              ) : null}
              {!item.isAvailable ? (
                <Text style={styles.unavailable}>Currently unavailable</Text>
              ) : null}
            </View>

            {item.isAvailable ? (
              <Pressable style={styles.addButton}>
                <Plus color="#FFFFFF" size={20} />
                <Text style={styles.addText}>Add to cart</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scroll: {
    paddingBottom: 32,
  },
  imageWrap: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: authTheme.input,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    marginTop: 20,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  name: {
    flex: 1,
    color: authTheme.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  description: {
    color: authTheme.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  category: {
    color: authTheme.brand,
    fontSize: 13,
    fontWeight: '600',
  },
  unavailable: {
    color: authTheme.error,
    fontWeight: '700',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    backgroundColor: authTheme.brand,
    borderRadius: 16,
    paddingVertical: 16,
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
