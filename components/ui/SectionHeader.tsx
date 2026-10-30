import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ChevronRight } from 'lucide-react-native';

export interface SectionHeaderProps {
  title: string;
  /** Optional item count rendered as a quiet badge beside the title. */
  count?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function SectionHeader({ title, count, action, style }: SectionHeaderProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
        <Text style={[{ color: colors.textMuted }, type.label]}>{title}</Text>
        {count !== undefined && (
          <View
            style={{
              minWidth: space.xl,
              paddingHorizontal: space.sm,
              paddingVertical: 2,
              borderRadius: radius.pill,
              backgroundColor: colors.cardMuted,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={[type.captionSemibold, { color: colors.text }]}>{count}</Text>
          </View>
        )}
      </View>
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={[{ color: colors.accent }, type.caption, { fontWeight: '600' }]}>{action.label}</Text>
          <ChevronRight size={16} color={colors.accent} style={{ marginLeft: 2, marginTop: 1 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}
