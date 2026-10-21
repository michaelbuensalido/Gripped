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

  // Spatial Glass cards: translucent backgrounds floating on soft shadows with top specular edge.
  const baseStyle: ViewStyle = {
    borderRadius: variant === 'hero' ? radius.xl : radius.lg,
    padding: variant === 'hero' ? space.xl : space.lg,
    backgroundColor:
      variant === 'muted'
        ? colors.cardMuted
        : variant === 'hero'
        ? colors.materialBase
        : colors.card,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: variant === 'hero' ? 'rgba(255,255,255,0.12)' : colors.border,
    ...(variant === 'muted' ? {} : shadow.card),
  };

  const specularRim =
    variant !== 'muted' ? (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 16,
          right: 16,
          height: 1,
          backgroundColor: variant === 'hero' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.09)',
        }}
      />
    ) : null;

  if (onPress) {
    return (
      <ScalePressable
        onPress={onPress}
        haptic="light"
        activeScale={0.98}
        style={[{ width: '100%' }]}
      >
        <View style={[baseStyle, style]} {...props}>
          {specularRim}
          {children}
        </View>
      </ScalePressable>
    );
  }

  return (
    <View style={[baseStyle, style]} {...props}>
      {specularRim}
      {children}
    </View>
  );
}
