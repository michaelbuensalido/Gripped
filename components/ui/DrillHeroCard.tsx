import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';
import { useTheme } from '../../theme/useTheme';

export interface DrillHeroCardProps {
  /** Lucide icon (already coloured) shown in the circular eyebrow badge. */
  icon: React.ReactNode;
  /** Short uppercase metric name, e.g. "Weekly volume". */
  eyebrow: string;
  /** Context line under the eyebrow (timeframe / selected week / selected grade). */
  subtitle?: string;
  /** Right-aligned slot: reset pill, delta pill, PB badge, grade pill. */
  trailing?: React.ReactNode;
  /** Top-edge linear wash colour. Defaults to `colors.washAccent`. */
  wash?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Hero glass card shared by all four Progress drill-down pages (v4.3).
 * Anatomy: tinted top wash → eyebrow row (icon badge · metric · context · trailing slot) → children.
 */
export function DrillHeroCard({
  icon,
  eyebrow,
  subtitle,
  trailing,
  wash,
  children,
  style,
}: DrillHeroCardProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <Card variant="hero" style={[{ gap: space.lg }, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={[wash ?? colors.washAccent, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 168 }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1 }}>
          <View
            style={{
              width: space.xxl,
              height: space.xxl,
              borderRadius: radius.pill,
              backgroundColor: colors.surfaceInset,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.micro, { color: colors.text }]} numberOfLines={1}>
              {eyebrow}
            </Text>
            {subtitle ? (
              <Text
                style={[type.captionMedium, { color: colors.textMuted, marginTop: 2 }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {trailing}
      </View>

      {children}
    </Card>
  );
}
