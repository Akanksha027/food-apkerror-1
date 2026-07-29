import { Pressable } from '@/components/common/Pressable';
import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Scale when pressed (default 0.97). */
  pressScale?: number;
  hitSlop?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'switch' | 'link' | 'none';
};

/**
 * Pressable with a soft spring scale. Styles stay on the pressable so
 * flexDirection rows and flex:1 layouts work correctly.
 */
export function SmoothPressable({
  children,
  onPress,
  disabled,
  style,
  pressScale = 0.97,
  hitSlop,
  accessibilityLabel,
  accessibilityRole = 'button',
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      onPressIn={() => {
        scale.value = withTiming(pressScale, {
          duration: 90,
          easing: Easing.out(Easing.quad),
        });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320, mass: 0.6 });
      }}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
