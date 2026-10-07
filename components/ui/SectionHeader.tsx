import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ChevronRight } from 'lucide-react-native';

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
        <TouchableOpacity onPress={action.onPress} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[{ color: colors.accent }, type.caption, { fontWeight: '600' }]}>{action.label}</Text>
          <ChevronRight size={16} color={colors.accent} style={{ marginLeft: 2, marginTop: 1 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}
