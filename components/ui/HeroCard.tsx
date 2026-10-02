import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';

// Decorative climbing-hold silhouette (abstract rounded shapes, 6% opacity)
function HoldSilhouette() {
  return (
    <Svg width={120} height={120} viewBox="0 0 100 100" accessible={false} style={{ transform: [{ translateX: 20 }, { translateY: -10 }] }}>
      <Path
        d="M80 30 C90 20, 100 40, 95 60 C90 80, 70 90, 50 85 C30 80, 20 60, 25 40 C30 20, 70 40, 80 30Z"
        fill="#1C1B22"
        opacity={0.08}
      />
    </Svg>
  );
}

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
      style={[{ borderRadius: radius.lg, padding: space.xl, ...shadow.card, overflow: 'hidden' }, style]}
      {...props}
    >
      {/* Decorative hold silhouette in the top-right corner */}
      <View style={{ position: 'absolute', top: 0, right: 0 }} pointerEvents="none">
        <HoldSilhouette />
      </View>

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
