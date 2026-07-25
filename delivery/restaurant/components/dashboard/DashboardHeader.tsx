import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronDown, Flame, Store, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type Props = {
  name: string;
  restaurantName?: string;
  restaurantCity?: string;
  hasNotifications?: boolean;
  activeOrders?: number;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
};

export function DashboardHeader({
  name,
  restaurantName,
  restaurantCity,
  hasNotifications = true,
  activeOrders = 0,
  onNotificationsPress,
  onProfilePress,
}: Props) {
  const insets = useSafeAreaInsets();
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const firstName = name.split(' ')[0] || name;

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={['#9E1A32', '#7A0E22', '#4A0812']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrap, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />
        <LinearGradient
          colors={['rgba(255,107,53,0.35)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={styles.warmWash}
          pointerEvents="none"
        />

        <View style={styles.topRow}>
          <Pressable style={styles.locationWrap}>
            <LinearGradient
              colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.08)']}
              style={styles.pinCircle}
            >
              <Store color="#FFFFFF" size={16} strokeWidth={2.2} />
            </LinearGradient>
            <View style={styles.locationTextWrap}>
              <View style={styles.locationLabelRow}>
                <Text style={styles.locationLabel}>Your outlet</Text>
                <ChevronDown color="rgba(255,255,255,0.85)" size={13} strokeWidth={2.5} />
              </View>
              <Text style={styles.locationValue} numberOfLines={1}>
                {restaurantName || 'Restaurant partner'}
              </Text>
              {restaurantCity ? (
                <Text style={styles.locationSubtitle} numberOfLines={1}>
                  {restaurantCity}
                </Text>
              ) : null}
            </View>
          </Pressable>

          <View style={styles.rightActions}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              onPress={onNotificationsPress}
            >
              <Bell color="#FFFFFF" size={18} strokeWidth={2.2} />
              {hasNotifications ? <View style={styles.dot} /> : null}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
              onPress={onProfilePress}
            >
              <User color="#FFFFFF" size={20} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <View>
          <View style={styles.liveRow}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {activeOrders > 0 ? `${activeOrders} live orders` : 'Kitchen online'}
              </Text>
            </View>
            <View style={styles.heatPill}>
              <Flame color="#FFD4A8" size={12} />
              <Text style={styles.heatText}>Service mode</Text>
            </View>
          </View>

          <Text style={styles.greeting}>
            Good {partOfDay}, {firstName}
          </Text>
          <Text style={styles.tagline}>Your kitchen pulse,{'\n'}live right now</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
  },
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  blobOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,107,53,0.18)',
    top: -40,
    right: -50,
  },
  blobTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 10,
    left: -40,
  },
  warmWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  pinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  locationTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.extraBold,
    marginTop: 2,
  },
  locationSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: authTheme.foodAccent,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 12,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  heatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,53,0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heatText: {
    color: '#FFE0C8',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  greeting: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.extraBold,
    marginTop: 6,
    letterSpacing: -0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
