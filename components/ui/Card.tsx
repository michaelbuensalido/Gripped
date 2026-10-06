import React, { useRef } from 'react';
import { View, Pressable, Animated, ViewProps, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { Platform } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'hero';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = 'default', onPress, style, ...props }: CardProps) {
  const { colors, radius, space, shadow } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Borderless ghost cards (v4.0): translucent backgrounds floating on soft shadows.
  const baseStyle: ViewStyle = {
    borderRadius: radius.lg,
    padding: space.lg,
    backgroundColor: variant === 'muted' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...(variant === 'muted' ? {} : shadow.card),
  };

  if (onPress) {
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    };

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: '100%' }}
      >
        <Animated.View
          style={[baseStyle, style, { transform: [{ scale: scaleAnim }] }]}
          {...props}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]} />
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, style]} {...props}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]} />
      {children}
    </View>
  );
}
