import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  active: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
  activeColor?: string;
  /** Soft circular backdrop behind the heart */
  withBackdrop?: boolean;
  backdropColor?: string;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  disabled?: boolean;
};

/**
 * Favorite heart — pops large then smoothly zooms out to rest size on tap.
 */
export function FavoriteHeartButton({
  active,
  onPress,
  size = 20,
  color = '#FFFFFF',
  activeColor = '#E23744',
  withBackdrop = false,
  backdropColor = 'rgba(255,255,255,0.92)',
  style,
  hitSlop = 12,
  disabled,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Zoom-out: pop oversized, then smoothly settle to 1
    scale.value = withSequence(
      withTiming(1.55, { duration: 0 }),
      withSpring(1, { damping: 11, stiffness: 200 })
    );
    onPress();
  };

  const stroke = active ? activeColor : color;
  const fill = active ? activeColor : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Remove from favourites' : 'Add to favourites'}
      accessibilityState={{ selected: active }}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.btn,
        withBackdrop && {
          backgroundColor: backdropColor,
          borderRadius: 999,
          width: size + 16,
          height: size + 16,
        },
        style,
      ]}
    >
      <Animated.View style={animStyle}>
        <Heart
          size={size}
          color={stroke}
          fill={fill}
          strokeWidth={2.2}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
