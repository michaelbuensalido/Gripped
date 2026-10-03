import React from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function PrimaryButton({
  testID,
  style,
  label,
  icon,
  loading,
  disabled,
  onPress,
}: PrimaryButtonProps) {
  const { colors, radius, type, motion } = useTheme();
  const isDisabled = disabled || loading;
  const reduceMotion = useReducedMotion();

  // Spring scale-down on press (v3.0 fluid physics). Skipped under reduce-motion.
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled || reduceMotion) return;
    scale.value = withSpring(motion.pressSpring.scale, {
      damping: motion.pressSpring.damping,
      stiffness: motion.pressSpring.stiffness,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: motion.pressSpring.damping,
      stiffness: motion.pressSpring.stiffness,
    });
  };

  const handlePress = () => {
    if (isDisabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    onPress();
  };

  return (
    <AnimatedPressable
      testID={testID}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          backgroundColor: isDisabled ? colors.cardMuted : colors.accent,
          height: 56,
          minHeight: 56,
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          borderWidth: isDisabled ? 1 : 0,
          borderColor: isDisabled ? colors.border : 'transparent',
          opacity: isDisabled ? 0.45 : 1,
        },
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={[
              type.heading,
              {
                color: colors.textOnAccent,
                fontSize: 16,
                letterSpacing: 0.3,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
