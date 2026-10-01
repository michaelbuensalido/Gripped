import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';

interface StatTileProps {
  value: string | number;
  label: string;
  trend?: string;
  flex?: boolean;
}

export function StatTile({ value, label, trend, flex }: StatTileProps) {
  const { colors, type, space } = useTheme();

  return (
    <Card variant="muted" style={{ ...(flex ? { flex: 1 } : {}), padding: space.md, alignItems: 'flex-start' }}>
      <Text style={[{ color: colors.text, marginBottom: space.xs }, type.stat]}>{value}</Text>
      <Text style={[{ color: colors.textMuted }, type.label]} numberOfLines={2}>{label}</Text>
      {trend && <Text style={[{ color: colors.flashText, marginTop: 4 }, type.caption]}>{trend}</Text>}
    </Card>
  );
}
