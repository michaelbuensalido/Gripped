import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';

// Keep getGradeBandColors for backward-compat (used in some files)
export function getGradeBandColors(gradeIndex: number, colors: any) {
  const { bg, text } = gradeBandStatic(gradeIndex);
  return { bg, text, border: 'transparent' };
}

function gradeBandStatic(gradeIndex: number) {
  if (gradeIndex <= 2) return { bg: '#2D303B', text: '#B3C2DE', solid: '#8FA3C7' };
  if (gradeIndex <= 5) return { bg: '#1D363A', text: '#6BDDD9', solid: '#2FC7C2' };
  if (gradeIndex <= 8) return { bg: '#3C3124', text: '#F6C46E', solid: '#F0A93B' };
  return { bg: '#38283B', text: '#E59BDB', solid: '#D473C8' };
}

interface GradePillProps {
  gradeIndex: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function GradePill({ gradeIndex, label, style }: GradePillProps) {
  const { type, gradeBand, radius } = useTheme();
  const band = gradeBand(gradeIndex);
  const displayLabel = label || (gradeIndex !== undefined && gradeIndex !== null ? `V${gradeIndex}` : '—');

  return (
    <View
      style={[
        {
          backgroundColor: band.bg,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: band.solid + '40', // Neon perimeter glow / rim
          alignSelf: 'flex-start',
          minWidth: 38,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: band.text,
          fontFamily: type.display.fontFamily,
          fontSize: 13,
          fontWeight: '700',
          lineHeight: 18,
          fontVariant: ['tabular-nums'],
          letterSpacing: 0.6,
        }}
      >
        {displayLabel}
      </Text>
    </View>
  );
}
