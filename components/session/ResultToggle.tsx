import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ResultType } from '../ui/ResultChip';
import { triggerHaptic } from '../../utils/haptics';

interface ResultToggleProps {
  value: ResultType;
  onChange: (value: ResultType) => void;
}

export function ResultToggle({ value, onChange }: ResultToggleProps) {
  const { colors, radius, type } = useTheme();

  const options: { label: string; value: ResultType; activeBg: string; activeText: string; activeBorder: string }[] = [
    { label: 'Flash', value: 'flash', activeBg: colors.flashSoft, activeText: colors.flashText, activeBorder: colors.flash },
    { label: 'Top', value: 'top', activeBg: colors.topSoft, activeText: colors.topText, activeBorder: colors.top },
    { label: 'Attempt', value: 'attempt', activeBg: colors.attemptSoft, activeText: colors.attemptText, activeBorder: colors.attempt },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => {
              triggerHaptic('light');
              onChange(opt.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              height: 56,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? opt.activeBg : colors.cardMuted,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: isActive ? opt.activeBorder : 'transparent',
            }}
          >
            <Text
              style={[
                type.heading,
                {
                  color: isActive ? opt.activeText : colors.textMuted,
                  fontSize: 15,
                  letterSpacing: 0.5,
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
