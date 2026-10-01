import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
}

export function SecondaryButton({ label, onPress }: SecondaryButtonProps) {
  const { colors, radius, type } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.accentSoft,
        height: 52,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      <Text style={[{ color: colors.accentText, fontFamily: type.heading.fontFamily, fontSize: type.heading.fontSize }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
