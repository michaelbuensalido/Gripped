import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';

// Decorative climbing-hold silhouette (abstract rounded shapes, 6% opacity)
function HoldSilhouette() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80" accessible={false}>
      {/* Large pinch hold */}
      <Path
        d="M55 20 C60 15, 72 18, 70 30 C68 42, 58 45, 52 38 C46 31, 50 25, 55 20Z"
        fill="#1C1B22"
        opacity={0.06}
      />
      {/* Small crimp */}
      <Path
        d="M30 50 C34 46, 42 48, 40 56 C38 64, 28 62, 26 55 C24 48, 26 54, 30 50Z"
        fill="#1C1B22"
        opacity={0.04}
      />
      {/* Round volume */}
      <Circle cx="65" cy="60" r="10" fill="#1C1B22" opacity={0.04} />
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
