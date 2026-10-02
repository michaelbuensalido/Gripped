import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';

interface StatTileProps {
  value: string | number;
  label: string;
  trend?: string;
  flex?: boolean;
  icon?: React.ReactNode;
  tintBg?: string; // e.g. colors.flashSoft — optional meaning-based soft bg
}

export function StatTile({ value, label, trend, flex, icon, tintBg }: StatTileProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <Card variant="muted" style={{
      ...(flex ? { flex: 1 } : {}),
      padding: space.sm,
      alignItems: 'flex-start',
      ...(tintBg ? { backgroundColor: tintBg } : {}),
    }}>
      {icon && (
        <View style={{ marginBottom: space.xs }}>{icon}</View>
      )}
      <Text style={[{ color: colors.text, marginBottom: 2, fontSize: 24 }, type.stat]}>{value}</Text>
      <Text style={[{ color: colors.textMuted }, type.label]} numberOfLines={1}>{label}</Text>
      <View style={{ height: 16, marginTop: 2, justifyContent: 'center' }}>
        {trend ? <Text style={[{ color: colors.flashText }, type.caption]}>{trend}</Text> : null}
      </View>
    </Card>
  );
}
