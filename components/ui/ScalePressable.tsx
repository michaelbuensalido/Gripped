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
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MIN_PRESS_SCALE = 0.97;
const PRESS_EASING = Easing.bezier(0.23, 1, 0.32, 1);

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
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  // Premium press feedback: a barely-there dip (never below 0.97) with a
  // quick ease-out, and a slightly slower release. No spring overshoot.
  const pressedScale = Math.max(activeScale, MIN_PRESS_SCALE);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || reduceMotion) return;
    scale.value = withTiming(pressedScale, { duration: 90, easing: PRESS_EASING });
  };

  const release = () => {
    if (reduceMotion) return;
    scale.value = withTiming(1, { duration: 180, easing: PRESS_EASING });
  };

  const handlePressOut = release;

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    release();
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
