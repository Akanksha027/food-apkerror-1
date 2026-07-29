import { Pressable } from '@/components/common/Pressable';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import type { HomeCategory } from '@/lib/home/types';

/** Matches Swiggy “What’s on your mind?” cutouts / labels from the mock. */
export const MIND_CATEGORIES: HomeCategory[] = [
  {
    id: 'mind-burger',
    label: 'Burgers',
    slug: 'burger',
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=280&h=280&fit=crop&q=85',
    sortOrder: 1,
  },
  {
    id: 'mind-pizza',
    label: 'Pizzas',
    slug: 'pizza',
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=280&h=280&fit=crop&q=85',
    sortOrder: 2,
  },
  {
    id: 'mind-rolls',
    label: 'Rolls',
    slug: 'rolls',
    imageUrl:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=280&h=280&fit=crop&q=85',
    sortOrder: 3,
  },
  {
    id: 'mind-chaap',
    label: 'Chaap',
    slug: 'chaap',
    imageUrl:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=280&h=280&fit=crop&q=85',
    sortOrder: 4,
  },
  {
    id: 'mind-biryani',
    label: 'Biryani',
    slug: 'biryani',
    imageUrl:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=280&h=280&fit=crop&q=85',
    sortOrder: 5,
  },
  {
    id: 'mind-north',
    label: 'North Indian',
    slug: 'north-indian',
    imageUrl:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=280&h=280&fit=crop&q=85',
    sortOrder: 6,
  },
  {
    id: 'mind-chinese',
    label: 'Chinese',
    slug: 'chinese',
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=280&h=280&fit=crop&q=85',
    sortOrder: 7,
  },
  {
    id: 'mind-momos',
    label: 'Momos',
    slug: 'momos',
    imageUrl:
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=280&h=280&fit=crop&q=85',
    sortOrder: 8,
  },
  {
    id: 'mind-dessert',
    label: 'Desserts',
    slug: 'dessert',
    imageUrl:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=280&h=280&fit=crop&q=85',
    sortOrder: 9,
  },
];

type Props = {
  categories?: HomeCategory[];
  /** Compact sticky strip — images only, slightly smaller. */
  compact?: boolean;
  /** Hide the “What’s on your mind?” title (sticky strip never shows it). */
  hideTitle?: boolean;
  onSelect?: (slug: string) => void;
};

export function WhatsOnYourMind({
  categories,
  compact = false,
  hideTitle = false,
  onSelect,
}: Props) {
  const router = useRouter();
  const list =
    categories && categories.length > 0
      ? categories.filter((c) => c.slug !== 'all')
      : MIND_CATEGORIES;

  const handlePress = (slug: string) => {
    onSelect?.(slug);
    router.push({ pathname: '/restaurants', params: { cuisine: slug } });
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!hideTitle && !compact ? (
        <Text style={styles.title}>What&apos;s on your mind?</Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={[styles.row, compact && styles.rowCompact]}
      >
        {list.map((cat) => (
          <Pressable
            key={cat.id || cat.slug}
            style={[styles.item, compact && styles.itemCompact]}
            onPress={() => handlePress(cat.slug)}
          >
            <Image
              source={{ uri: cat.imageUrl }}
              style={[styles.image, compact && styles.imageCompact]}
              contentFit="contain"
              transition={180}
            />
            <Text
              style={[styles.label, compact && styles.labelCompact]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingBottom: 8,
    borderRadius: 24,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  wrapCompact: {
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: '#02060C',
    letterSpacing: -0.4,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  row: {
    paddingHorizontal: 12,
    gap: 6,
  },
  rowCompact: {
    paddingHorizontal: 10,
    gap: 4,
  },
  item: {
    width: 88,
    alignItems: 'center',
  },
  itemCompact: {
    width: 68,
  },
  image: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  imageCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  label: {
    marginTop: 6,
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: '#3E4152',
    textAlign: 'center',
  },
  labelCompact: {
    marginTop: 4,
    fontSize: 11,
  },
});
