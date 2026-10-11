import React from 'react';
import { View, Text } from 'react-native';
import { Zap, Check, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { ResultType } from '../ui/ResultChip';
import { triggerHaptic } from '../../utils/haptics';
import { ScalePressable } from '../ui/ScalePressable';

interface ResultToggleProps {
  value: ResultType;
  onChange: (value: ResultType) => void;
}

export function ResultToggle({ value, onChange }: ResultToggleProps) {
  const { colors, radius, type } = useTheme();

  const options: {
    label: string;
    value: ResultType;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    icon: (active: boolean) => React.ReactNode;
  }[] = [
    {
      label: 'Flash',
      value: 'flash',
      activeBg: colors.flashSoft,
      activeText: colors.flashText,
      activeBorder: colors.flash,
      icon: (active) => <Zap size={15} color={active ? colors.flash : colors.textMuted} strokeWidth={2.5} style={{ marginRight: 6 }} />,
    },
    {
      label: 'Top',
      value: 'top',
      activeBg: colors.topSoft,
      activeText: colors.topText,
      activeBorder: colors.top,
      icon: (active) => <Check size={15} color={active ? colors.top : colors.textMuted} strokeWidth={2.5} style={{ marginRight: 6 }} />,
    },
    {
      label: 'Attempt',
      value: 'attempt',
      activeBg: colors.attemptSoft,
      activeText: colors.attemptText,
      activeBorder: colors.attempt,
      icon: (active) => <RotateCcw size={14} color={active ? colors.attempt : colors.textMuted} strokeWidth={2.5} style={{ marginRight: 6 }} />,
    },
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
          <ScalePressable
            key={opt.value}
            onPress={() => {
              triggerHaptic('light');
              onChange(opt.value);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label} outcome`}
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              height: 56,
              minHeight: 56,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? opt.activeBg : colors.cardMuted,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: isActive ? opt.activeBorder : 'transparent',
            }}
          >
            {opt.icon(isActive)}
            <Text
              style={[
                type.heading,
                {
                  color: isActive ? opt.activeText : colors.textMuted,
                  fontSize: 15,
                  letterSpacing: 0.5,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {opt.label}
            </Text>
          </ScalePressable>
        );
      })}
    </View>
  );
}
