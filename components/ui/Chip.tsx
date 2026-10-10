import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ScalePressable } from './ScalePressable';

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { colors, type, radius } = useTheme();

  const content = (
    <View
      style={{
        backgroundColor: active ? colors.accent : colors.cardMuted,
        borderRadius: radius.pill,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderWidth: 1,
        borderColor: active ? 'transparent' : colors.border,
        minHeight: 38,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[
          type.control,
          {
            color: active ? colors.textOnAccent : colors.text,
            fontWeight: active ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <ScalePressable
        onPress={onPress}
        haptic="light"
        activeScale={0.96}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        {content}
      </ScalePressable>
    );
  }

  return content;
}
