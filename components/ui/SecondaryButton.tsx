import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface SecondaryButtonProps {
  testID?: string;
  label: string;
  onPress: () => void;
}

export function SecondaryButton({ testID, label, onPress }: SecondaryButtonProps) {
  const { colors, radius, type } = useTheme();

  return (
    <TouchableOpacity testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.cardMuted,
        height: 52,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={[{ color: colors.text, fontFamily: type.heading.fontFamily, fontSize: type.heading.fontSize }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
