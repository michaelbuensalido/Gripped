import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export function getGradeBandColors(gradeIndex: number, colors: any) {
  if (gradeIndex <= 2) return { bg: colors.glass, text: colors.textMuted }; // Beginner V0-V2
  if (gradeIndex <= 5) return { bg: colors.flashSoft, text: colors.flashText }; // Intermediate V3-V5
  if (gradeIndex <= 8) return { bg: colors.dangerSoft, text: colors.dangerText }; // Advanced V6-V8
  return { bg: colors.accentSoft, text: colors.accentText }; // Expert V9+
}

interface GradePillProps {
  gradeIndex: number;
  label?: string;
}

export function GradePill({ gradeIndex, label }: GradePillProps) {
  const { colors, radius, space, type } = useTheme();
  const band = getGradeBandColors(gradeIndex, colors);
  const displayLabel = label || `V${gradeIndex}`;

  return (
    <View style={{
      backgroundColor: band.bg,
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
      borderRadius: radius.sm,
      alignSelf: 'flex-start',
    }}>
      <Text style={[{ color: band.text, fontFamily: type.heading.fontFamily, fontSize: 13, fontWeight: '600' }]}>
        {displayLabel}
      </Text>
    </View>
  );
}
