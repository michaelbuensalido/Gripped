import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

// Keep getGradeBandColors for backward-compat (used in some files)
export function getGradeBandColors(gradeIndex: number, colors: any) {
  const { bg, text } = gradeBandStatic(gradeIndex);
  return { bg, text, border: 'transparent' };
}

function gradeBandStatic(gradeIndex: number) {
  if (gradeIndex <= 2) return { bg: '#E8EAF0', text: '#3D4166', solid: '#7C85C4' };
  if (gradeIndex <= 5) return { bg: '#DDF1D3', text: '#1F6B3A', solid: '#3BA462' };
  if (gradeIndex <= 8) return { bg: '#FBE3E6', text: '#9B2C3A', solid: '#C0392B' };
  return { bg: '#ECE8FB', text: '#5440B5', solid: '#6A52D1' };
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
