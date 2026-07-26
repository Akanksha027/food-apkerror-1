import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { HomeCategory } from '@/lib/home/types';

type Props = {
  categories: HomeCategory[];
  selectedSlug?: string;
  onSelect?: (slug: string) => void;
  loading?: boolean;
  /** Compact horizontal strip for the pinned home chrome. */
  sticky?: boolean;
};

const EMOJI_BY_SLUG: Record<string, string> = {
  all: '🍽️',
  pizza: '🍕',
  biryani: '🍲',
  burger: '🍔',
  'north-indian': '🍛',
  chinese: '🥡',
  dessert: '🍰',
  cafe: '☕',
  rolls: '🌯',
  momos: '🥟',
  shawarma: '🥙',
  'south-indian': '🥞',
  seafood: '🦐',
  steak: '🥩',
  grill: '🥩',
};

export function CategoryStripPhotos({
  categories,
  selectedSlug = 'all',
  onSelect,
  loading,
  sticky = false,
}: Props) {
  const router = useRouter();
  const [active, setActive] = useState(selectedSlug);

  const sorted = useMemo(
    () =>
      [...categories]
        .filter((c) => c.slug !== 'all')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const handlePress = (slug: string) => {
    setActive(slug);
    onSelect?.(slug);
    if (slug === 'all') return;
    router.push({ pathname: '/restaurants', params: { cuisine: slug } });
  };

  const renderItem = (cat: HomeCategory) => {
    const selected = active === cat.slug;
    const emoji = EMOJI_BY_SLUG[cat.slug] ?? '🍴';

    return (
      <Pressable
        key={cat.id || cat.slug}
        style={[styles.item, sticky && styles.itemSticky]}
        onPress={() => handlePress(cat.slug)}
      >
        <View style={[styles.card, selected && styles.cardActive, sticky && styles.cardSticky]}>
          {cat.imageUrl ? (
            <Image
              source={{ uri: cat.imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Text style={styles.emoji}>{emoji}</Text>
          )}
        </View>
        <Text
          style={[styles.label, sticky && styles.labelSticky, selected && styles.labelActive]}
          numberOfLines={1}
        >
          {cat.label}
        </Text>
      </Pressable>
    );
  };

  if (!loading && sorted.length === 0) return null;

  return (
    <View style={[styles.section, sticky && styles.sectionSticky]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={[styles.list, sticky && styles.listSticky]}
      >
        {loading && sorted.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <View key={`sk-${i}`} style={styles.item}>
                <View style={[styles.card, styles.skeleton]} />
                <View style={styles.skeletonLabel} />
              </View>
            ))
          : sorted.map(renderItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: -10,
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionSticky: {
    marginTop: 0,
    paddingTop: 6,
    paddingBottom: 4,
  },
  list: {
    paddingHorizontal: 16,
    gap: 14,
  },
  listSticky: {
    paddingHorizontal: 12,
    gap: 10,
  },
  item: {
    width: 78,
    alignItems: 'center',
  },
  itemSticky: {
    width: 68,
  },
  card: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  cardSticky: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginBottom: 6,
  },
  cardActive: {
    borderColor: authTheme.brand,
    borderWidth: 1.5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  labelSticky: {
    fontSize: 11,
  },
  labelActive: {
    color: authTheme.brand,
    fontWeight: '800',
  },
  skeleton: {
    backgroundColor: '#F3F4F6',
  },
  skeletonLabel: {
    width: 48,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EEE8E6',
  },
});
