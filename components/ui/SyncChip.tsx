import React from 'react';
import { View, Text } from 'react-native';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

interface SyncChipProps {
  state: 'synced' | 'syncing' | 'offline' | { waiting: number };
}

export function SyncChip({ state }: SyncChipProps) {
  const { colors, type, radius } = useTheme();

  let icon = <Cloud size={14} color={colors.textMuted} />;
  let label = 'Synced';
  let color = colors.textMuted;

  if (state === 'offline') {
    icon = <CloudOff size={14} color={colors.dangerText} />;
    label = 'Offline';
    color = colors.dangerText;
  } else if (state === 'syncing') {
    icon = <RefreshCw size={14} color={colors.accentText} />;
    label = 'Syncing...';
    color = colors.accentText;
  } else if (typeof state === 'object' && state.waiting > 0) {
    icon = <Cloud size={14} color={colors.textMuted} />;
    label = `${state.waiting} waiting`;
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.cardMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    }}>
      {icon}
      <Text style={[type.caption, { color }]}>{label}</Text>
    </View>
  );
}
