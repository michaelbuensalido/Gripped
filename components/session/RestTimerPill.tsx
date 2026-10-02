import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface RestTimerPillProps {
  seconds: number;
  active: boolean;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function RestTimerPill({ seconds, active }: RestTimerPillProps) {
  const { colors, type, radius } = useTheme();

  if (!active) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accentSoft,
        borderColor: colors.border,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
      }}
    >
      <Text
        style={[
          type.label,
          {
            color: colors.accentText,
            fontSize: 11,
            fontVariant: ['tabular-nums'],
            letterSpacing: 0.8,
          },
        ]}
      >
        REST {pad(m)}:{pad(s)}
      </Text>
    </View>
  );
}
