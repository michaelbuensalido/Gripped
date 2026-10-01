import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors, radius, space, type } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: selected ? colors.accentSoft : colors.cardMuted,
        paddingHorizontal: space.md,
        paddingVertical: 8,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={[{ color: selected ? colors.accentText : colors.textMuted }, type.caption, { fontWeight: selected ? '600' : '400' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
