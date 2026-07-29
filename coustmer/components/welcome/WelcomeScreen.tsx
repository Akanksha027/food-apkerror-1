import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, LayoutChangeEvent, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Mail, Truck } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { AuthBottomSheet } from '@/components/auth/AuthBottomSheet';
import { useAuthSheetStore, type AuthSheetView } from '@/store/auth-sheet-store';
import { fonts } from '@/constants/typography';
import { authTheme } from '@/constants/auth-theme';

type Props = {
  openAuthOnMount?: AuthSheetView;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function resolveAuthParam(auth?: string | string[]): AuthSheetView | null {
  const value = Array.isArray(auth) ? auth[0] : auth;
  if (value === 'login') return 'login';
  if (value === 'sign-up' || value === 'register') return 'register';
  if (value === 'forgot-password') return 'forgot-password';
  if (value === 'verify-otp') return 'verify-otp';
  return null;
}

// ---------------------------------------------------------------------------
// Sunburst background — the alternating light/dark ray pattern radiating from
// behind the hero image. react-native doesn't support conic gradients, so we
// draw it as a ring of thin SVG wedges around a center point.
// ---------------------------------------------------------------------------

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarPoint(cx, cy, r, endAngle);
  const end = polarPoint(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function SunburstBackground() {
  const cx = SCREEN_WIDTH / 2;
  const cy = SCREEN_HEIGHT * 0.46;
  const radius = Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2);
  const rayCount = 40;

  const wedges = useMemo(() => {
    const step = 360 / rayCount;
    return Array.from({ length: rayCount }).map((_, i) => {
      const start = i * step;
      const end = start + step;
      const isLight = i % 2 === 0;
      return {
        d: wedgePath(cx, cy, radius, start, end),
        fill: isLight ? '#FFFFFF' : '#000000',
        opacity: isLight ? 0.05 : 0.06,
      };
    });
  }, [cx, cy, radius]);

  return (
    <Svg
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      style={StyleSheet.absoluteFill}
    >
      {wedges.map((w, i) => (
        <Path key={i} d={w.d} fill={w.fill} opacity={w.opacity} />
      ))}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Torn-paper banner — a ripped-edge sticker shape behind the "Earn Crowns"
// label. Built as an SVG polygon whose edges are jittered with a seeded
// pseudo-random generator, so the ragged edge is irregular but stable across
// re-renders (doesn't reshuffle every time the component updates).
// ---------------------------------------------------------------------------

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateTornPath(width: number, height: number, jag: number, seed: number) {
  const rand = seededRandom(seed);
  const segLen = 9;
  const pts: { x: number; y: number }[] = [];
  const ox = jag;
  const oy = jag;

  for (let x = 0; x <= width; x += segLen) {
    pts.push({ x: ox + x, y: oy + (rand() - 0.5) * jag * 1.6 });
  }
  for (let y = segLen; y <= height; y += segLen) {
    pts.push({ x: ox + width + (rand() - 0.5) * jag, y: oy + y });
  }
  for (let x = width; x >= 0; x -= segLen) {
    pts.push({ x: ox + x, y: oy + height + (rand() - 0.5) * jag * 1.6 });
  }
  for (let y = height - segLen; y >= 0; y -= segLen) {
    pts.push({ x: ox + (rand() - 0.5) * jag, y: oy + y });
  }

  return (
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
  );
}

const TORN_JAG = 6;

function TornBanner({ text }: { text: string }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height }
    );
  };

  const path = useMemo(() => {
    if (!size) return '';
    return generateTornPath(size.width, size.height, TORN_JAG, 42);
  }, [size]);

  return (
    <View style={styles.tornOuter}>
      {size && (
        <Svg
          width={size.width + TORN_JAG * 2}
          height={size.height + TORN_JAG * 2}
          style={{ position: 'absolute', top: -TORN_JAG, left: -TORN_JAG }}
        >
          <Path d={path} fill="#FFFFFF" />
        </Svg>
      )}
      <View style={styles.tornInner} onLayout={onLayout}>
        <Text style={styles.bannerText}>{text}</Text>
      </View>
    </View>
  );
}

export function WelcomeScreen({ openAuthOnMount }: Props) {
  const { auth, identifier } = useLocalSearchParams<{ auth?: string; identifier?: string }>();
  const visible = useAuthSheetStore((s) => s.visible);
  const view = useAuthSheetStore((s) => s.view);
  const otpIdentifier = useAuthSheetStore((s) => s.otpIdentifier);
  const open = useAuthSheetStore((s) => s.open);
  const close = useAuthSheetStore((s) => s.close);
  const setView = useAuthSheetStore((s) => s.setView);

  useEffect(() => {
    if (openAuthOnMount) {
      open(openAuthOnMount);
    }
  }, [openAuthOnMount, open]);

  useEffect(() => {
    const resolved = resolveAuthParam(auth);
    if (!resolved) return;

    if (resolved === 'verify-otp' && identifier) {
      open('verify-otp', { otpIdentifier: String(identifier) });
      return;
    }

    open(resolved);
  }, [auth, identifier, open]);

  const handleGetStarted = () => {
    open('login');
  };

  return (
    <View style={styles.root}>
      {/* Deep Red Background + sunburst rays radiating from behind the hero image */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: authTheme.brand }]} />
      <SunburstBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView 
          contentContainerStyle={styles.contentContainer} 
          showsVerticalScrollIndicator={false} 
          bounces={false}
        >
          <View style={styles.header}>
            <View style={styles.bannerWrapper}>
              <TornBanner text="Delicious Food Awaits" />
            </View>
            <Text style={[styles.titleLine, { fontSize: Math.min(SCREEN_WIDTH * 0.13, 54), lineHeight: Math.min(SCREEN_WIDTH * 0.14, 60) }]}>Welcome to</Text>
            <Text style={[styles.titleLine, { fontSize: Math.min(SCREEN_WIDTH * 0.13, 54), lineHeight: Math.min(SCREEN_WIDTH * 0.14, 60) }]}>Food Zone</Text>
          </View>

          <View style={styles.imageSection}>
            <Image
              source={require('../../public/bg1.png')}
              style={styles.burgerImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted} activeOpacity={0.85}>
              <View style={styles.btnIconLeft}>
                <Mail color={authTheme.brand} size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.primaryButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By tapping Search Nearby or Continue with Email, Google,
              Facebook, or Apple, you agree to Food Zone's Terms &
              Conditions and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AuthBottomSheet
        visible={visible}
        view={view}
        otpIdentifier={otpIdentifier}
        onClose={close}
        onViewChange={setView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 16,
    alignItems: 'center',
    zIndex: 2,
  },
  bannerWrapper: {
    marginBottom: 20,
    transform: [{ rotate: '-2deg' }],
  },
  tornOuter: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tornInner: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bannerText: {
    color: authTheme.brand,
    fontFamily: fonts.displayBold,
    fontSize: 16,
  },
  titleLine: {
    fontSize: 54,
    fontFamily: fonts.bubbly,
    color: '#FFFFFF',
    lineHeight: 60,
    textAlign: 'center',
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    zIndex: 1,
  },
  burgerImage: {
    width: '120%',
    height: '100%',
  },
  footer: {
    paddingBottom: 8,
    alignItems: 'center',
    gap: 16,
    zIndex: 2,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: authTheme.brand,
    fontSize: 16,
    fontFamily: fonts.displayBold,
  },

  btnIconLeft: {
    position: 'absolute',
    left: 24,
  },
  termsText: {
    marginTop: 8,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fonts.uiMedium,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 16,
  },
});