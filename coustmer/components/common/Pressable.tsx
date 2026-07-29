import React, { ComponentProps } from 'react';
import { Pressable as NativePressable, Animated, PressableProps, StyleProp, ViewStyle } from 'react-native';

const AnimatedNativePressable = Animated.createAnimatedComponent(NativePressable);

export const Pressable = React.forwardRef<any, PressableProps>((props, ref) => {
  const { style, onPressIn, onPressOut, ...rest } = props;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true })
    ]).start();
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true })
    ]).start();
    if (onPressOut) onPressOut(e);
  };

  const animatedStyle = { opacity, transform: [{ scale }] };

  // Combine styles safely
  const combinedStyle = typeof style === 'function' 
    ? (state: any) => [style(state), animatedStyle]
    : [style, animatedStyle];

  return (
    <AnimatedNativePressable
      ref={ref}
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={combinedStyle as any}
    />
  );
});
