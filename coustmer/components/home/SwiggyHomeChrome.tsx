import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Map as MapIcon, MapPin, Menu, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SmoothPressable } from '@/components/common/SmoothPressable';
import { fonts } from '@/constants/typography';
import type { Deal, HomeBanner } from '@/lib/customer/types';

type Props = {
  topInset?: number;
  greeting?: string;
  deliveryTitle: string;
  deliverySubtitle?: string;
  isDetectingLocation?: boolean;
  onLocationPress?: () => void;
  onMenuPress?: () => void;
  vegActive?: boolean;
  onVegPress?: () => void;
  banners?: HomeBanner[];
  deals?: Deal[];
  activeFilter?: string | null;
  onFilterPress?: (id: string) => void;
};

export function SwiggyHomeChrome({
  topInset = 0,
  deliveryTitle,
  deliverySubtitle,
  isDetectingLocation,
  onLocationPress,
}: Props) {
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: topInset + 12 }]}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=1000&auto=format&fit=crop' }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <SmoothPressable style={styles.iconButton} onPress={() => router.push('/profile')}>
          <Menu color="#FFFFFF" size={24} strokeWidth={2.5} />
        </SmoothPressable>

        <Pressable style={styles.locationWrap} onPress={onLocationPress}>
          <Text style={styles.locationLabel}>Delivery location</Text>
          <View style={styles.locationTitleRow}>
            <MapPin color="#FF5A41" size={16} strokeWidth={3} />
            <Text style={styles.locationTitle} numberOfLines={1}>
              {isDetectingLocation ? 'Detecting…' : (deliverySubtitle ? deliverySubtitle : deliveryTitle)}
            </Text>
          </View>
        </Pressable>

        <SmoothPressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <Bell color="#FFFFFF" size={24} strokeWidth={2.5} />
        </SmoothPressable>
      </View>

      {/* Middle Promo Text */}
      <View style={styles.promoWrap}>
        <View style={styles.promoTitleRow}>
          <Text style={styles.promoPercent}>15%</Text>
          <View style={styles.promoTitleCol}>
            <Text style={styles.promoExtra}>EXTRA</Text>
            <Text style={styles.promoDiscount}>DISCOUNT</Text>
          </View>
        </View>
        <Text style={styles.promoSubtitle}>Get your first order{'\n'}delivery free!</Text>
      </View>

      {/* Search Bar Row */}
      <View style={styles.searchRow}>
        <Pressable style={styles.searchBox} onPress={() => router.push('/search')}>
          <Search color="#9CA3AF" size={20} strokeWidth={2.5} />
          <Text style={styles.searchPlaceholder}>Search by name & restaurant</Text>
        </Pressable>
        <SmoothPressable style={styles.mapButton}>
          <MapIcon color="#FF5A41" size={22} strokeWidth={2.5} />
        </SmoothPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  locationLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 4,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  promoWrap: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    zIndex: 2,
  },
  promoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoPercent: {
    color: '#FF5A41',
    fontSize: 64,
    fontFamily: fonts.display,
    letterSpacing: -2,
    lineHeight: 70,
  },
  promoTitleCol: {
    justifyContent: 'center',
  },
  promoExtra: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  promoDiscount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  promoSubtitle: {
    color: '#F3F4F6',
    fontSize: 18,
    fontFamily: fonts.medium,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 26,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 2,
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
    gap: 12,
  },
  searchPlaceholder: {
    color: '#9CA3AF',
    fontSize: 15,
    fontFamily: fonts.medium,
    flex: 1,
  },
  mapButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
