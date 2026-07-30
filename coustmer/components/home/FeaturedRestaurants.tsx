import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock } from 'lucide-react-native';

import { fonts } from '@/constants/typography';
import type { Restaurant } from '@/lib/restaurant/types';

type Props = {
  restaurants: Restaurant[];
};

// Simple hash to assign a brand color based on restaurant name
function getBrandColor(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const colors = [
    '#FACC15', // Yellow (like McDonald's)
    '#1F2937', // Dark gray (like KFC)
    '#EF4444', // Red
    '#10B981', // Green
    '#F97316', // Orange
  ];
  return colors[hash % colors.length];
}

export function FeaturedRestaurants({ restaurants }: Props) {
  const router = useRouter();

  if (!restaurants || restaurants.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const cover = item.coverUrl || item.imageUrl || item.logoUrl;
          const time = item.deliveryTime || '35 mins';
          const bgColor = getBrandColor(item.name);
          const isDark = bgColor === '#1F2937';

          return (
            <Pressable
              style={styles.cardWrap}
              onPress={() => router.push(`/restaurants/${item.id}`)}
            >
              {/* Colored Card with Image */}
              <View style={[styles.coloredCard, { backgroundColor: bgColor }]}>
                {cover ? (
                  <Image
                    source={{ uri: cover }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.image, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                )}

                {/* Top Left Badge: Discount */}
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{(10 + (getBrandColor(item.name).charCodeAt(1) % 5) * 10)}% OFF</Text>
                </View>


              </View>

              {/* Bottom Details (Outside Card) */}
              <View style={styles.detailsRow}>
                <View style={styles.nameWrap}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View style={styles.nowOpenPill}>
                  <Text style={styles.nowOpenText}>Now Open</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardWrap: {
    width: 280,
  },
  // ── Colored Image Card ──
  coloredCard: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  timeText: {
    color: '#FFFFFF',
    fontFamily: fonts.uiSemi,
    fontSize: 12,
  },


  // ── Bottom Details ──
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: '#111827',
  },
  flame: {
    fontSize: 16,
    marginLeft: 6,
  },
  nowOpenPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  nowOpenText: {
    color: '#F97316',
    fontFamily: fonts.uiMedium,
    fontSize: 12,
  },
});
