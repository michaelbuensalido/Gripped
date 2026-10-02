import React from 'react';
import { TouchableOpacity, Text, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface SecondaryButtonProps {
  testID?: string;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'muted' | 'accentSoft';
}

export function SecondaryButton({ testID, label, onPress, style, variant = 'accentSoft' }: SecondaryButtonProps) {
  const { colors, radius, type } = useTheme();

  const isAccent = variant === 'accentSoft';

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: isAccent ? colors.accentSoft : colors.cardMuted,
          height: 56,
          minHeight: 56,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: isAccent ? 'transparent' : colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          type.heading,
          {
            color: isAccent ? colors.accentText : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
