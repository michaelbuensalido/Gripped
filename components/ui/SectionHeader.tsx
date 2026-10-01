import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  const { colors, type, space } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }, style]}>
      <Text style={[{ color: colors.textMuted }, type.label]}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={[{ color: colors.accent }, type.caption, { fontWeight: '600' }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
