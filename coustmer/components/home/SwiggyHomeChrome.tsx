import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronDown,
  CreditCard,
  Menu,
  Mic,
  Search,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SmoothPressable } from '@/components/common/SmoothPressable';
import { VegMarkIcon } from '@/components/home/VegMarkIcon';
import { fonts } from '@/constants/typography';
import type { Deal, HomeBanner } from '@/lib/customer/types';

const VEG_GREEN = '#0F8A45';
const HEADER_DARK = '#2C0A0E';

/** Food plates for welcome / Flat ₹200 / explore promo cards */
const PROMO_FOOD = {
  main: require('@/assets/images/favorites/hero-1.png'),
  sideA: require('@/assets/images/favorites/hero-2.png'),
  sideB: require('@/assets/images/favorites/hero-3.png'),
} as const;

const SEARCH_FOODS = [
  'Sweets',
  'Pizza',
  'Biryani',
  'Burger',
  'Momos',
  'Rolls',
  'Pasta',
  'Cake',
  'Ice Cream',
  'Sandwich',
  'Thali',
  'Dosa',
  'Chicken',
  'Paneer',
  'Chinese',
  'North Indian',
  'Chaap',
  'Noodles',
];

type Props = {
  topInset?: number;
  greeting?: string;
  deliveryTitle: string;
  deliverySubtitle?: string;
  isDetectingLocation?: boolean;
  onLocationPress?: () => void;
  onMenuPress?: () => void;
  vegActive: boolean;
  onVegPress: () => void;
  banners?: HomeBanner[];
  deals?: Deal[];
  activeFilter?: string | null;
  onFilterPress?: (id: string) => void;
};

/** Single letter — soft sine-style wave, gentle scale (no harsh pop). */
function WavyPopLetter({
  char,
  delayMs,
  script,
}: {
  char: string;
  delayMs: number;
  script?: boolean;
}) {
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const isSpace = char === ' ' || char === '\u00A0';

  useEffect(() => {
    if (isSpace) return;

    const ease = Easing.inOut(Easing.sin);
    const up = 380;
    const down = 420;
    const rest = 900;

    y.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-4.5, { duration: up, easing: ease }),
          withTiming(0, { duration: down, easing: ease }),
          withTiming(0, { duration: rest })
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: up, easing: ease }),
          withTiming(1, { duration: down, easing: ease }),
          withTiming(1, { duration: rest })
        ),
        -1,
        false
      )
    );
  }, [delayMs, isSpace, scale, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  if (isSpace) {
    return (
      <Text style={script ? styles.welcomeScript : styles.welcomePlain}>
        {'\u00A0'}
      </Text>
    );
  }

  return (
    <Animated.Text
      style={[script ? styles.welcomeScript : styles.welcomePlain, style]}
    >
      {char}
    </Animated.Text>
  );
}

/** “Welcome, {name}!” — smooth ripple wave across letters. */
function WavyPopWelcome({ greeting }: { greeting: string }) {
  const name = `${greeting}!`;
  const stagger = 55;
  return (
    <View style={styles.welcomeLine}>
      {'Welcome, '.split('').map((ch, i) => (
        <WavyPopLetter
          key={`w-${i}`}
          char={ch === ' ' ? '\u00A0' : ch}
          delayMs={i * stagger}
        />
      ))}
      {name.split('').map((ch, i) => (
        <WavyPopLetter
          key={`n-${i}`}
          char={ch}
          delayMs={('Welcome, '.length + i) * stagger}
          script
        />
      ))}
    </View>
  );
}

function UpwardFoodPlaceholder() {
  const [index, setIndex] = useState(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    let swapTimer: ReturnType<typeof setTimeout> | null = null;
    const id = setInterval(() => {
      y.value = withTiming(-16, {
        duration: 240,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 200 });

      swapTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % SEARCH_FOODS.length);
        y.value = 16;
        opacity.value = 0;
        y.value = withTiming(0, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(1, { duration: 240 });
      }, 240);
    }, 2500);
    return () => {
      clearInterval(id);
      if (swapTimer) clearTimeout(swapTimer);
    };
  }, [opacity, y]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  const food = SEARCH_FOODS[index] ?? 'Sweets';

  return (
    <View style={styles.placeholderRow}>
      <Text style={styles.searchStatic}>Search for &apos;</Text>
      <View style={styles.foodNameClip}>
        <Animated.View style={animStyle}>
          <Text style={styles.searchFoodName} numberOfLines={1}>
            {food}
          </Text>
        </Animated.View>
      </View>
      <Text style={styles.searchStatic}>&apos;</Text>
    </View>
  );
}

export function SwiggyHomeChrome({
  topInset = 0,
  greeting = 'foodie',
  deliveryTitle,
  deliverySubtitle,
  isDetectingLocation,
  onLocationPress,
  onMenuPress,
  vegActive,
  onVegPress,
  banners = [],
  deals = [],
}: Props) {
  const router = useRouter();

  const promoMain = deals[0]?.title || banners[0]?.title || 'Meals At ₹99';
  const promoSideA = deals[1]?.title || 'Flat ₹200 OFF & More';
  const promoSideB =
    deals[2]?.title || banners[1]?.title || 'Get 70% OFF + Cashback';

  return (
    <LinearGradient
      colors={['#AC0F45', '#AC0F45', '#AC0F45']}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={[styles.darkHeader, { paddingTop: topInset + 8 }]}>
        <View style={styles.topRow}>
          <SmoothPressable
            style={styles.location}
            onPress={onLocationPress}
            pressScale={0.98}
          >
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {isDetectingLocation ? 'Detecting…' : deliveryTitle}
              </Text>
              <ChevronDown color="#FFFFFF" size={16} strokeWidth={2.8} />
            </View>
            {deliverySubtitle ? (
              <Text style={styles.locationSub} numberOfLines={1}>
                {deliverySubtitle}
              </Text>
            ) : null}
          </SmoothPressable>

          <View style={styles.topRight}>
            <SmoothPressable
              style={styles.menuBtn}
              onPress={() => router.push('/profile')}
              pressScale={0.9}
            >
              <User color="#FFFFFF" size={20} strokeWidth={2} />
            </SmoothPressable>
          </View>
        </View>
      </View>

      {/* Soft, lighter shadow under address */}
      <View style={styles.addressShadowWrap} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.06)',
            'rgba(0, 0, 0, 0.02)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.addressShadow}
        />
      </View>

      <View style={styles.pinkBody}>
        <View style={styles.searchRow}>
          <SmoothPressable
            style={styles.searchBar}
            onPress={() => router.push('/search')}
            pressScale={0.985}
            accessibilityLabel="Search"
          >
            <View style={styles.searchBarInner}>
              <Search color="#686B78" size={18} strokeWidth={2} />
              <UpwardFoodPlaceholder />
              <View style={styles.searchDivider} />
              <Mic color="#FF5A41" size={18} strokeWidth={2} />
            </View>
          </SmoothPressable>

          <SmoothPressable
            style={[styles.vegBtn, vegActive && styles.vegBtnOn]}
            onPress={onVegPress}
            accessibilityLabel="Vegetarian filter"
            pressScale={0.94}
          >
            <Text style={[styles.vegLabel, vegActive && styles.vegLabelOn]}>
              VEG
            </Text>
            <View style={styles.vegStack}>
              <VegMarkIcon size={12} />
              <View style={[styles.vegSwitch, vegActive && styles.vegSwitchOn]}>
                <View style={[styles.vegKnob, vegActive && styles.vegKnobOn]} />
              </View>
            </View>
          </SmoothPressable>
        </View>

        <WavyPopWelcome greeting={greeting} />

        <View style={styles.promoGrid}>
          <Pressable
            style={styles.promoMain}
            onPress={() => router.push('/restaurants')}
          >
            <Text style={styles.promoEyebrow}>99 store</Text>
            <Text style={styles.promoMainTitle} numberOfLines={2}>
              {promoMain}
            </Text>
            <Image
              source={PROMO_FOOD.main}
              style={styles.promoMainImg}
              contentFit="contain"
            />
          </Pressable>

          <View style={styles.promoSideCol}>
            <Pressable
              style={styles.promoSide}
              onPress={() => router.push('/deals')}
            >
              <Text style={styles.promoSideText} numberOfLines={3}>
                {promoSideA}
              </Text>
              <Image
                source={PROMO_FOOD.sideA}
                style={styles.promoSideImg}
                contentFit="contain"
              />
            </Pressable>
            <Pressable
              style={styles.promoSide}
              onPress={() => router.push('/deals')}
            >
              <Text style={styles.promoSideText} numberOfLines={3}>
                {promoSideB}
              </Text>
              <Image
                source={PROMO_FOOD.sideB}
                style={styles.promoSideImg}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  darkHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    zIndex: 3,
  },
  addressShadowWrap: {
    height: 0,
    zIndex: 4,
    overflow: 'visible',
  },
  addressShadow: {
    height: 14,
    marginTop: -1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    zIndex: 2,
  },
  location: {
    flex: 1,
    minWidth: 0,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  locationSub: {
    marginTop: 3,
    fontFamily: fonts.ui,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  freeText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: '#111111',
    letterSpacing: 0.3,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinkBody: {
    marginTop: -1,
    paddingTop: 14,
    paddingBottom: 28,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeholderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  searchStatic: {
    fontFamily: fonts.ui,
    fontSize: 15,
    color: '#93959F',
  },
  foodNameClip: {
    height: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    flexShrink: 1,
  },
  searchFoodName: {
    fontFamily: fonts.ui,
    fontSize: 15,
    color: '#93959F',
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E2E7',
  },
  vegBtn: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  vegBtnOn: {
    backgroundColor: '#FFFFFF',
  },
  vegLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: '#3E4152',
    letterSpacing: 0.4,
  },
  vegLabelOn: {
    color: VEG_GREEN,
  },
  vegStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  vegSwitch: {
    width: 30,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  vegSwitchOn: {
    backgroundColor: VEG_GREEN,
  },
  vegKnob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  vegKnobOn: {
    alignSelf: 'flex-end',
  },
  welcomeLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 18,
    marginBottom: 14,
    zIndex: 1,
  },
  welcomePlain: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  welcomeScript: {
    fontFamily: fonts.script,
    fontSize: 28,
    color: '#F5D565',
    includeFontPadding: false,
  },
  promoGrid: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 150,
    zIndex: 1,
  },
  promoMain: {
    flex: 1.15,
    backgroundColor: 'rgba(48, 12, 8, 0.45)',
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
    minHeight: 150,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  promoEyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: '#F5D565',
  },
  promoMainTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.3,
    width: '65%',
  },
  promoMainImg: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 118,
    height: 118,
  },
  promoSideCol: {
    flex: 1,
    gap: 10,
  },
  promoSide: {
    flex: 1,
    backgroundColor: 'rgba(48, 12, 8, 0.45)',
    borderRadius: 14,
    padding: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  promoSideText: {
    fontFamily: fonts.displayBold,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
    width: '70%',
  },
  promoSideImg: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 58,
    height: 58,
  },
});
