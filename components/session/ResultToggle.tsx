import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ResultType } from '../ui/ResultChip';

interface ResultToggleProps {
  value: ResultType;
  onChange: (value: ResultType) => void;
}

export function ResultToggle({ value, onChange }: ResultToggleProps) {
  const { colors, space, radius, type } = useTheme();

  const options: { label: string; value: ResultType; activeBg: string; activeText: string }[] = [
    { label: 'Flash', value: 'flash', activeBg: colors.flashSoft, activeText: colors.flashText },
    { label: 'Top', value: 'top', activeBg: colors.topSoft, activeText: colors.topText },
    { label: 'Attempt', value: 'attempt', activeBg: colors.attemptSoft, activeText: colors.attemptText },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? opt.activeBg : 'transparent',
              borderRadius: radius.pill,
            }}
          >
            <Text style={[
              type.label,
              { color: isActive ? opt.activeText : colors.textMuted }
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
