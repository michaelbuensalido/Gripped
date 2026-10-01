import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/useTheme';

export interface HeroCardProps extends ViewProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  children?: React.ReactNode;
}

export function HeroCard({ title, subtitle, value, children, style, ...props }: HeroCardProps) {
  const { colors, radius, space, shadow, type } = useTheme();

  return (
    <LinearGradient
      colors={[colors.accentSoft, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ borderRadius: radius.lg, padding: space.xl, ...shadow.card }, style]}
      {...props}
    >
      <View style={{ marginBottom: children ? space.lg : 0 }}>
        <Text style={[type.label, { color: colors.accentText, marginBottom: space.xs }]}>{title}</Text>
        {value !== undefined && (
          <Text style={[type.stat, { color: colors.text, marginBottom: space.xs, fontSize: 32 }]}>{value}</Text>
        )}
        {subtitle && (
          <Text style={[type.caption, { color: colors.textMuted }]}>{subtitle}</Text>
        )}
      </View>
      {children}
    </LinearGradient>
  );
}
