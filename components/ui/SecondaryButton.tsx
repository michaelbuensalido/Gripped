import React from 'react';
import { Text, ViewStyle, StyleProp } from 'react-native';
import { ScalePressable } from './ScalePressable';
import { useTheme } from '../../theme/useTheme';

interface SecondaryButtonProps {
  testID?: string;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'muted' | 'accentSoft';
  disabled?: boolean;
}

export function SecondaryButton({
  testID,
  label,
  onPress,
  style,
  variant = 'accentSoft',
  disabled,
}: SecondaryButtonProps) {
  const { colors, radius, type } = useTheme();

  const isAccent = variant === 'accentSoft';

  return (
    <ScalePressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      haptic="medium"
      activeScale={0.97}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        {
          backgroundColor: isAccent ? colors.accentSoft : colors.cardMuted,
          height: 56,
          minHeight: 56,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          borderWidth: 1,
          borderColor: isAccent ? 'transparent' : colors.border,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          type.heading,
          {
            color: isAccent ? colors.accentText : colors.text,
            fontSize: 16,
            letterSpacing: 0.3,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}
