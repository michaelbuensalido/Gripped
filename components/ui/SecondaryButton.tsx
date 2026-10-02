import React from 'react';
import { TouchableOpacity, Text, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
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

  const handlePress = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    onPress();
  };

  return (
    <TouchableOpacity
      testID={testID}
      onPress={handlePress}
      activeOpacity={0.75}
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
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
