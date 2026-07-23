import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { HomeCategory } from '@/lib/home/types';

// Legacy Android only — New Architecture treats this as a no-op and warns.
const isNewArchitecture =
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager !=
    null ||
  (globalThis as { RN$Bridgeless?: boolean }).RN$Bridgeless === true;

if (
  Platform.OS === 'android' &&
  !isNewArchitecture &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLLAPSED_COUNT = 7;

type Props = {
  categories: HomeCategory[];
  selectedSlug?: string;
  onSelect?: (slug: string) => void;
  loading?: boolean;
  /** Compact horizontal strip for the pinned home chrome. */
  sticky?: boolean;
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
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      ),
    [categories]
  );

  // Sticky chrome: full horizontal swipe. Normal: collapse + More grid.
  const collapsed = sorted.slice(0, COLLAPSED_COUNT);
  const visible = sticky || expanded ? sorted : collapsed;
  const hasMore = !sticky && sorted.length > COLLAPSED_COUNT;

  const handlePress = (slug: string) => {
    setActive(slug);
    onSelect?.(slug);
    if (slug === 'all') return;
    router.push({ pathname: '/restaurants', params: { cuisine: slug } });
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const renderItem = (cat: HomeCategory) => {
    const selected = active === cat.slug;
    return (
      <Pressable
        key={cat.id || cat.slug}
        style={expanded && !sticky ? styles.gridItem : styles.item}
        onPress={() => handlePress(cat.slug)}
      >
        <View
          style={[
            styles.imageRing,
            sticky && styles.imageRingSticky,
            selected && styles.imageRingActive,
          ]}
        >
          {cat.imageUrl ? (
            <Image
              source={{ uri: cat.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]} />
          )}
        </View>
        <Text
          style={[
            styles.label,
            sticky && styles.labelSticky,
            selected && styles.labelActive,
          ]}
          numberOfLines={2}
        >
          {cat.label}
        </Text>
        {selected ? (
          <View style={styles.indicator} />
        ) : (
          <View style={styles.indicatorSpacer} />
        )}
      </Pressable>
    );
  };

  if (!loading && sorted.length === 0) return null;

  return (
    <View style={[styles.section, sticky && styles.sectionSticky]}>
      {!sticky ? (
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>What&apos;s on your mind?</Text>
            <Text style={styles.subtitle}>Browse by cuisine & craving</Text>
          </View>
          {expanded ? (
            <Pressable onPress={toggleExpand} hitSlop={8} style={styles.headerAction}>
              <Text style={styles.headerActionText}>Show less</Text>
              <ChevronUp color={authTheme.brand} size={16} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading && sorted.length === 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`sk-${i}`} style={styles.item}>
              <View style={[styles.imageRing, sticky && styles.imageRingSticky, styles.skeletonCircle]} />
              <View style={styles.skeletonLabel} />
              <View style={styles.indicatorSpacer} />
            </View>
          ))}
        </ScrollView>
      ) : expanded && !sticky ? (
        <View style={styles.grid}>
          {visible.map(renderItem)}
          {hasMore ? (
            <Pressable style={styles.gridItem} onPress={toggleExpand}>
              <View style={[styles.imageRing, styles.moreRing]}>
                <View style={styles.moreInner}>
                  <ChevronUp color={authTheme.brand} size={22} />
                </View>
              </View>
              <Text style={[styles.label, styles.moreLabel]}>Show less</Text>
              <View style={styles.indicatorSpacer} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={styles.list}
        >
          {visible.map(renderItem)}

          {hasMore ? (
            <Pressable style={styles.item} onPress={toggleExpand}>
              <View style={[styles.imageRing, styles.moreRing]}>
                <View style={styles.moreInner}>
                  <LayoutGrid color={authTheme.brand} size={22} />
                </View>
              </View>
              <Text style={[styles.label, styles.moreLabel]}>More</Text>
              <View style={styles.moreChevron}>
                <ChevronDown color={authTheme.brand} size={12} />
              </View>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E8E8',
  },
  sectionSticky: {
    marginTop: 0,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: authTheme.textMuted,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: authTheme.brand,
  },
  list: {
    paddingHorizontal: 12,
    gap: 4,
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  item: {
    width: 82,
    alignItems: 'center',
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  imageRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  imageRingSticky: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6,
  },
  imageRingActive: {
    backgroundColor: authTheme.brand,
    padding: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  imageFallback: {
    backgroundColor: '#E5E7EB',
  },
  moreRing: {
    backgroundColor: 'rgba(122, 14, 34, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(122, 14, 34, 0.25)',
    borderStyle: 'dashed',
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 2,
    lineHeight: 14,
    minHeight: 28,
  },
  labelSticky: {
    fontSize: 11,
    minHeight: 24,
  },
  labelActive: {
    color: authTheme.brand,
    fontWeight: '800',
  },
  moreLabel: {
    color: authTheme.brand,
    fontWeight: '800',
  },
  moreChevron: {
    marginTop: 2,
  },
  indicator: {
    marginTop: 4,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: authTheme.brand,
  },
  indicatorSpacer: {
    marginTop: 4,
    height: 3,
  },
  skeletonCircle: {
    backgroundColor: '#EEE8E6',
  },
  skeletonLabel: {
    width: 48,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EEE8E6',
    marginTop: 2,
  },
});
