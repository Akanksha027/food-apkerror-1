import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Check, Home, MapPin, Percent } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type PlacementPhase = 'none' | 'placing' | 'placed';

interface Props {
  phase: PlacementPhase;
  addressLabel: string;
  addressText: string;
  savings: number;
}

const { width } = Dimensions.get('window');

export function OrderPlacementModal({ phase, addressLabel, addressText, savings }: Props) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase === 'placing') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
      scale.value = 0;
      checkOpacity.value = 0;
    } else if (phase === 'placed') {
      rotation.value = 0; // stop rotation
      scale.value = withSpring(1, { damping: 12, stiffness: 90 });
      checkOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    }
  }, [phase]);

  const animatedSpin = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedScale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedCheck = useAnimatedStyle(() => {
    return {
      opacity: checkOpacity.value,
      transform: [{ scale: checkOpacity.value }],
    };
  });

  if (phase === 'none') return null;

  return (
    <Modal visible={true} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container}>
        {phase === 'placed' && savings > 0 && (
          <View style={styles.savingsBanner}>
            <View style={styles.savingsIcon}>
              <Percent color="#FFFFFF" size={12} strokeWidth={3} />
            </View>
            <Text style={styles.savingsText}>₹{savings.toFixed(0)} saved on this order</Text>
          </View>
        )}

        <View style={styles.content}>
          {phase === 'placing' ? (
            <View style={styles.mapCircleWrapper}>
              <View style={styles.mapCircleInner}>
                <View style={styles.iconPin}>
                  {addressLabel.toLowerCase() === 'home' || addressLabel.toLowerCase() === 'house' ? (
                    <Home color="#FFFFFF" size={32} />
                  ) : (
                    <MapPin color="#FFFFFF" size={32} />
                  )}
                </View>
              </View>
              <Animated.View style={[styles.spinnerBorder, animatedSpin]} />
            </View>
          ) : (
            <Animated.View style={[styles.successCircle, animatedScale]}>
              <Animated.View style={animatedCheck}>
                <Check color="#FFFFFF" size={60} strokeWidth={4} />
              </Animated.View>
            </Animated.View>
          )}

          <Text style={styles.statusText}>
            {phase === 'placing' ? 'Placing order to' : 'Order placed for'}
          </Text>
          
          <Text style={styles.addressLabel}>{addressLabel || 'Home'}</Text>
          <Text style={styles.addressDesc} numberOfLines={2}>
            {addressText}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 40,
  },
  savingsIcon: {
    backgroundColor: '#1BA672',
    padding: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  savingsText: {
    color: '#1BA672',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 100, // offset for visual center
  },
  mapCircleWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  mapCircleInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: '#E8E9EB', // Imagine map texture here
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spinnerBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 82,
    borderWidth: 4,
    borderColor: '#FF5A41',
  },
  iconPin: {
    backgroundColor: '#2C3035',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5A41',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#1BA672',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  statusText: {
    fontSize: 18,
    color: '#1C1C1C',
    fontWeight: '500',
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1C1C1C',
    marginBottom: 8,
  },
  addressDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
