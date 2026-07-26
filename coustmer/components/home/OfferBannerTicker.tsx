import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Gift, Percent } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { Deal, HomeBanner } from '@/lib/customer/types';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;
const CARD_W = SCREEN_W - H_PAD * 2;
const GAP = 12;
const SNAP = CARD_W + GAP;

/** Brand-only gradients — orange theme on every card */
const BRAND_ACCENTS: [string, string, string][] = [
  ['#FF5A41', '#FF7A66', '#FF5A41'],
  ['#E8482F', '#FF5A41', '#FF6B52'],
  ['#FF5A41', '#FF6B52', '#FF7A66'],
  ['#E8482F', '#FF5A41', '#FF7A66'],
];

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  cta: string;
  accent: [string, string, string];
  imageUrl?: string;
  deepLink?: string;
};

type Props = {
  banners?: HomeBanner[];
  deals?: Deal[];
};

function mapApiSlides(banners: HomeBanner[], deals: Deal[]): Slide[] {
  const fromBanners: Slide[] = banners
    .filter((b) => b?.title?.trim())
    .map((b, i) => ({
      id: `banner-${b.id || i}`,
      eyebrow: 'OFFER',
      title: b.title.trim(),
      subtitle: 'Tap to explore this offer',
      cta: 'View offer',
      accent: BRAND_ACCENTS[i % BRAND_ACCENTS.length],
      imageUrl: b.imageUrl,
      deepLink: b.deepLink,
    }));

  const fromDeals: Slide[] = deals
    .filter((d) => (d?.title || d?.description || d?.code)?.toString().trim())
    .map((d, i) => ({
      id: `deal-${String(d.id ?? i)}`,
      eyebrow: d.code ? `CODE ${String(d.code).toUpperCase()}` : 'DEAL',
      title: (d.title || 'Special offer').toString().trim(),
      subtitle:
        (d.description as string | undefined)?.trim() ||
        (d.code ? `Use code ${d.code}` : 'Limited-time savings for you'),
      cta: 'Grab deal',
      accent: BRAND_ACCENTS[(fromBanners.length + i) % BRAND_ACCENTS.length],
      imageUrl: d.imageUrl,
    }));

  // Prefer banners, then deals — both from API, no hardcoded fillers
  const merged = [...fromBanners, ...fromDeals];
  const seen = new Set<string>();
  return merged.filter((s) => {
    const key = s.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function OfferBannerTicker({ banners = [], deals = [] }: Props) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = useMemo(
    () => mapApiSlides(banners, deals),
    [banners, deals]
  );

  // Auto-swipe every 4 seconds when API returns 2+ offers
  useEffect(() => {
    const count = slides.length;
    if (count <= 1) return;

    const timer = setInterval(() => {
      if (pausedRef.current) return;
      const next = (activeRef.current + 1) % count;
      activeRef.current = next;
      setActive(next);
      scrollRef.current?.scrollTo({ x: next * SNAP, animated: true });
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const pauseAutoplay = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  // Reset index when API list changes
  useEffect(() => {
    activeRef.current = 0;
    setActive(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [slides.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    if (index >= 0 && index < slides.length && index !== activeRef.current) {
      activeRef.current = index;
      setActive(index);
    }
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.heading}>Offers for you</Text>
          <Text style={styles.subheading}>
            {slides.length > 1
              ? `${slides.length} deals · rotates every 4 sec`
              : 'From your local partners'}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/deals')} hitSlop={8}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onScrollBeginDrag={pauseAutoplay}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.list}
      >
        {slides.map((slide) => {
          const longTitle = slide.title.length > 22;
          const Icon = slide.eyebrow.startsWith('CODE') ? Gift : Percent;
          return (
            <Pressable
              key={slide.id}
              style={[styles.card, { width: CARD_W }]}
              onPress={() => router.push('/deals')}
            >
              {slide.imageUrl ? (
                <>
                  <Image
                    source={{ uri: slide.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={['rgba(232,72,47,0.55)', 'rgba(255, 90, 65,0.88)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </>
              ) : (
                <LinearGradient
                  colors={slide.accent}
                  locations={[0, 0.55, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}

              <View style={styles.blobLarge} pointerEvents="none" />
              <View style={styles.blobSmall} pointerEvents="none" />

              <View style={styles.content}>
                <View style={styles.topRow}>
                  <View style={styles.eyebrow}>
                    <Icon color="#FF5A41" size={12} strokeWidth={2.5} />
                    <Text style={styles.eyebrowText} numberOfLines={1}>
                      {slide.eyebrow}
                    </Text>
                  </View>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>OFFER</Text>
                  </View>
                </View>

                <View style={styles.mid}>
                  <Text
                    style={[styles.title, longTitle && styles.titleCompact]}
                    numberOfLines={2}
                  >
                    {slide.title}
                  </Text>
                  {slide.subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {slide.subtitle}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.ctaChip}>
                  <Text style={styles.ctaText}>{slide.cta}</Text>
                  <ArrowRight color="#FF5A41" size={14} strokeWidth={2.5} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.id}
              style={[styles.dot, i === active && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F7F7F8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginBottom: 10,
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  subheading: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: authTheme.textMuted,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: authTheme.brand,
    marginBottom: 2,
  },
  list: {
    paddingHorizontal: H_PAD,
    paddingBottom: 2,
  },
  card: {
    height: 160,
    marginRight: GAP,
    borderRadius: 18,
    overflow: 'hidden',
  },
  blobLarge: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -30,
    top: -26,
  },
  blobSmall: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    right: 44,
    bottom: -18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 13,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '72%',
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FF5A41',
    flexShrink: 1,
  },
  percentBadge: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  percentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  mid: {
    flexShrink: 1,
    marginVertical: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  titleCompact: {
    fontSize: 17,
    lineHeight: 21,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 16,
  },
  ctaChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 11,
  },
  ctaText: {
    color: '#FF5A41',
    fontSize: 12,
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6D3D1',
  },
  dotActive: {
    width: 20,
    backgroundColor: authTheme.brand,
  },
});
