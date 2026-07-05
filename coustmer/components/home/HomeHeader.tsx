import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronDown, MapPin, Search, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type Props = {
  greeting: string;
  tier?: string;
  loyaltyPoints?: number;
  topInset?: number;
};

export function HomeHeader({ greeting, tier, loyaltyPoints, topInset = 0 }: Props) {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#7A0E22', '#5A0A18']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: topInset + 12 }]}
    >
      <View style={styles.topRow}>
        <Pressable
          style={styles.locationWrap}
          hitSlop={6}
          onPress={() => router.push('/restaurants/index')}
        >
          <View style={styles.pinCircle}>
            <MapPin color="#FFFFFF" size={16} />
          </View>
          <View>
            <View style={styles.locationLabelRow}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <ChevronDown color="rgba(255,255,255,0.85)" size={13} />
            </View>
            <Text style={styles.locationValue} numberOfLines={1}>
              Home · Set your address
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
          <User color="#FFFFFF" size={20} />
        </Pressable>
      </View>

      <Text style={styles.greeting}>Hey {greeting} 👋</Text>
      <Text style={styles.tagline}>What are you craving today?</Text>

      <Pressable
        style={styles.searchBar}
        onPress={() => router.push('/restaurants/index')}
      >
        <Search color={authTheme.brand} size={18} />
        <Text style={styles.searchPlaceholder}>
          Search for restaurants & dishes
        </Text>
      </Pressable>

      {tier ? (
        <View style={styles.loyaltyRow}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{tier.toUpperCase()} MEMBER</Text>
          </View>
          <Text style={styles.pointsText}>
            {loyaltyPoints ?? 0} loyalty points
          </Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginTop: 20,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    color: authTheme.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  loyaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
});
