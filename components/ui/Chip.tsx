import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export function Chip({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors, type, space, radius } = useTheme();
  
  const content = (
    <View
      style={{
        backgroundColor: active ? colors.accent : colors.card,
        borderRadius: radius.pill,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <Text style={[type.body, { color: active ? colors.textOnAccent : colors.text }]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
