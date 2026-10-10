import React from 'react';
import {
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
  AccessibilityRole,
  AccessibilityState,
  Insets,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/haptics';
import { useTheme } from '../../theme/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ScalePressableProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event?: GestureResponderEvent) => void;
  onLongPress?: (event?: GestureResponderEvent) => void;
  disabled?: boolean;
  activeScale?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'none';
  testID?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  accessibilityHint?: string;
  hitSlop?: Insets | number;
  minTouchTarget?: boolean;
}

export function ScalePressable({
  children,
  style,
  onPress,
  onLongPress,
  disabled = false,
  activeScale = 0.97,
  haptic = 'light',
  testID,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  accessibilityHint,
  hitSlop,
  minTouchTarget = false,
}: ScalePressableProps) {
  const { motion } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || reduceMotion) return;
    scale.value = withSpring(activeScale, {
      damping: motion.pressSpring?.damping ?? 18,
      stiffness: motion.pressSpring?.stiffness ?? 350,
      mass: 0.8,
    });
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    scale.value = withSpring(1, {
      damping: motion.pressSpring?.damping ?? 18,
      stiffness: motion.pressSpring?.stiffness ?? 350,
      mass: 0.8,
    });
  };

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    if (haptic !== 'none') {
      triggerHaptic(haptic);
    }
    onPress?.(e);
  };

  return (
    <AnimatedPressable
      testID={testID}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState ?? { disabled }}
      accessibilityHint={accessibilityHint}
      hitSlop={hitSlop ?? (minTouchTarget ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined)}
      style={[
        minTouchTarget && { minHeight: 44, minWidth: 44, justifyContent: 'center' },
        style,
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
