import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ScalePressable } from './ScalePressable';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'hero';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = 'default', onPress, style, ...props }: CardProps) {
  const { colors, radius, space, shadow } = useTheme();

  // Borderless ghost cards: translucent backgrounds floating on soft shadows.
  const baseStyle: ViewStyle = {
    borderRadius: radius.lg,
    padding: space.lg,
    backgroundColor: variant === 'muted' ? colors.cardMuted : colors.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...(variant === 'muted' ? {} : shadow.card),
  };

  if (onPress) {
    return (
      <ScalePressable
        onPress={onPress}
        haptic="light"
        activeScale={0.98}
        style={[{ width: '100%' }]}
      >
        <View style={[baseStyle, style]} {...props}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardMuted }]} />
          {children}
        </View>
      </ScalePressable>
    );
  }

  return (
    <View style={[baseStyle, style]} {...props}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardMuted }]} />
      {children}
    </View>
  );
}
