import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { HomeBanner } from '@/lib/customer/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const GRADIENTS: [string, string][] = [
  ['#7A0E22', '#B91C1C'],
  ['#C2410C', '#EA580C'],
  ['#6D28D9', '#9333EA'],
  ['#0F766E', '#0D9488'],
];

export function BannerCarousel({ banners }: { banners: HomeBanner[] }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (banners.length === 0) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12));
    setActive(index);
  };

  return (
    <View style={styles.section}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.list}
      >
        {banners.map((banner, index) => (
          <View key={banner.id} style={[styles.card, { width: CARD_WIDTH }]}>
            {banner.imageUrl ? (
              <Image
                source={{ uri: banner.imageUrl }}
                style={styles.fill}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={GRADIENTS[index % GRADIENTS.length]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fill}
              />
            )}
            <View style={styles.overlay}>
              <Text style={styles.tag}>FEATURED</Text>
              <Text style={styles.title} numberOfLines={2}>
                {banner.title}
              </Text>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>Order now</Text>
                <ArrowRight color="#FFFFFF" size={14} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((banner, index) => (
            <View
              key={banner.id}
              style={[styles.dot, index === active && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  overlay: {
    padding: 18,
  },
  tag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
    maxWidth: '85%',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E4E9',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#7A0E22',
  },
});
