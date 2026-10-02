import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';

interface PrimaryButtonProps {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function PrimaryButton({
  testID,
  style,
  label,
  icon,
  loading,
  disabled,
  onPress,
}: PrimaryButtonProps) {
  const { colors, radius, type } = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
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
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          backgroundColor: isDisabled ? colors.cardMuted : colors.accent,
          height: 56,
          minHeight: 56,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          borderWidth: isDisabled ? 1 : 0,
          borderColor: isDisabled ? colors.border : 'transparent',
          opacity: isDisabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={[
              type.heading,
              {
                color: colors.textOnAccent,
                fontSize: 16,
                letterSpacing: 0.3,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
