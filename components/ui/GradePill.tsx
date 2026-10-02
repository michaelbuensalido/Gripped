import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

// Keep getGradeBandColors for backward-compat (used in some files)
export function getGradeBandColors(gradeIndex: number, colors: any) {
  const { bg, text } = gradeBandStatic(gradeIndex);
  return { bg, text, border: 'transparent' };
}

function gradeBandStatic(gradeIndex: number) {
  if (gradeIndex <= 2) return { bg: 'rgba(96, 165, 250, 0.15)', text: '#93C5FD', solid: '#3B82F6' };
  if (gradeIndex <= 5) return { bg: 'rgba(74, 222, 128, 0.15)', text: '#86EFAC', solid: '#22C55E' };
  if (gradeIndex <= 8) return { bg: 'rgba(251, 146, 60, 0.15)', text: '#FDBA74', solid: '#F97316' };
  return { bg: 'rgba(192, 132, 252, 0.15)', text: '#D8B4FE', solid: '#A855F7' };
}

interface GradePillProps {
  gradeIndex: number;
  label?: string;
}

export function GradePill({ gradeIndex, label }: GradePillProps) {
  const { type, gradeBand } = useTheme();
  const band = gradeBand(gradeIndex);
  const displayLabel = label || `V${gradeIndex}`;

  return (
    <View style={{
      backgroundColor: band.bg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'flex-start',
      minWidth: 36,
      alignItems: 'center',
    }}>
      <Text style={{ color: band.text, fontFamily: type.display.fontFamily, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
        {displayLabel}
      </Text>
    </View>
  );
}
