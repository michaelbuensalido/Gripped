import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'hero';
  onPress?: () => void;
}

export function Card({ children, variant = 'default', onPress, style, ...props }: CardProps) {
  const { colors, radius, space } = useTheme();

  const baseStyle = {
    borderRadius: radius.lg,
    padding: space.lg,
    backgroundColor: variant === 'muted' ? colors.cardMuted : colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  };

  const content = (
    <View style={[baseStyle, style]} {...props}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}
