import React from 'react';
import { Text, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { ScalePressable } from './ScalePressable';
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

  return (
    <ScalePressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      haptic="medium"
      activeScale={0.97}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          backgroundColor: isDisabled ? colors.cardMuted : colors.accent,
          height: 56,
          minHeight: 56,
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          borderWidth: isDisabled ? 1 : 0,
          borderColor: isDisabled ? colors.border : 'transparent',
          opacity: isDisabled ? 0.45 : 1,
          ...(isDisabled ? {} : {
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 14,
            elevation: 4,
          }),
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
                fontWeight: '700',
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </ScalePressable>
  );
}
