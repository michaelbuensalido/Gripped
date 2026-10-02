import React from 'react';
import { View, Text } from 'react-native';
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
}

export function StatTile({ value, label, trend, flex, icon, tintBg }: StatTileProps) {
  const { colors, type, space } = useTheme();

  return (
    <Card style={{
      ...(flex ? { flex: 1 } : {}),
      padding: space.lg,
      alignItems: 'flex-start',
      ...(tintBg ? { backgroundColor: tintBg } : {}),
    }}>
      {icon && (
        <View style={{ marginBottom: space.sm }}>{icon}</View>
      )}
      {typeof value === 'number' ? (
        <AnimatedCounter
          value={value}
          style={[{ color: colors.text, marginBottom: space.xs }, type.stat]}
        />
      ) : (
        <Text
          style={[{ color: colors.text, marginBottom: space.xs }, type.stat]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
      <Text style={[{ color: colors.textMuted }, type.label]} numberOfLines={1}>
        {label}
      </Text>
      {trend ? (
        <Text style={[{ color: colors.flashText, marginTop: space.xs }, type.caption]}>
          {trend}
        </Text>
      ) : null}
    </Card>
  );
}
