import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export function getGradeBandColors(gradeIndex: number, colors: any) {
  if (gradeIndex === undefined || gradeIndex === null) return { bg: colors.cardMuted, text: colors.textMuted, border: colors.border };
  if (gradeIndex <= 2) return { bg: 'transparent', text: colors.textMuted, border: colors.border }; // Beginner V0-V2
  if (gradeIndex <= 5) return { bg: colors.flashSoft, text: colors.flashText, border: 'transparent' }; // Intermediate V3-V5
  if (gradeIndex <= 8) return { bg: colors.dangerSoft, text: colors.dangerText, border: 'transparent' }; // Advanced V6-V8
  return { bg: colors.accentSoft, text: colors.accentText, border: 'transparent' }; // Expert V9+
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
      borderWidth: 1,
      borderColor: band.border,
      alignSelf: 'flex-start',
    }}>
      <Text style={[{ color: band.text, fontFamily: type.heading.fontFamily, fontSize: 13, fontWeight: '600' }]}>
        {displayLabel}
      </Text>
    </View>
  );
}
