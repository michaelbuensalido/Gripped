import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, type, space, radius } = useTheme();
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: active ? colors.accentSoft : colors.card,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.border,
        borderRadius: radius.pill,
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
      }}
    >
      <Text style={[type.label, { color: active ? colors.accentText : colors.textMuted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
