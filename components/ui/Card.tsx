import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'hero';
  onPress?: () => void;
}

export function Card({ children, variant = 'default', onPress, style, ...props }: CardProps) {
  const { colors, radius, space, shadow } = useTheme();

  const baseStyle = {
    borderRadius: radius.lg,
    padding: space.lg,
    backgroundColor: variant === 'muted' ? colors.cardMuted : colors.card,
    ...(variant !== 'muted' ? shadow.card : {}),
  };

  const content = variant === 'hero' ? (
    <LinearGradient
      colors={[colors.accentSoft, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ borderRadius: radius.lg, padding: space.lg }, shadow.card, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[baseStyle, style]} {...props}>
      {children}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  }
  return content;
}
