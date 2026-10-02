import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';
import { AnimatedCounter } from './AnimatedCounter';

interface StatTileProps {
  value: string | number;
  label: string;
  trend?: string;
  flex?: boolean;
  icon?: React.ReactNode;
  tintBg?: string; // optional meaning-based soft bg
  style?: StyleProp<ViewStyle>;
}

export function StatTile({ value, label, trend, flex, icon, tintBg, style }: StatTileProps) {
  const { colors, type, space } = useTheme();

  return (
    <Card
      style={[
        {
          ...(flex ? { flex: 1 } : {}),
          padding: space.lg,
          alignItems: 'flex-start',
          ...(tintBg ? { backgroundColor: tintBg } : {}),
        },
        style,
      ]}
    >
      {icon && (
        <View style={{ marginBottom: space.sm }}>{icon}</View>
      )}

      {typeof value === 'number' ? (
        <AnimatedCounter
          value={value}
          style={[
            type.stat,
            {
              color: colors.text,
              fontSize: 28,
              lineHeight: 34,
              fontVariant: ['tabular-nums'],
              marginBottom: 2,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            type.stat,
            {
              color: colors.text,
              fontSize: 28,
              lineHeight: 34,
              fontVariant: ['tabular-nums'],
              marginBottom: 2,
            },
          ]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {value}
        </Text>
      )}

      <Text
        style={[
          type.label,
          {
            color: colors.textMuted,
            fontSize: 11,
            letterSpacing: 1.1,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {trend ? (
        <Text
          style={[
            type.caption,
            {
              color: colors.flashText, // Neon contrast result color
              fontWeight: '700',
              marginTop: space.xs,
              letterSpacing: 0.3,
            },
          ]}
        >
          {trend}
        </Text>
      ) : null}
    </Card>
  );
}
