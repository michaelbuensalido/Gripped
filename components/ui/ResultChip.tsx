import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export type ResultType = 'flash' | 'top' | 'attempt';

interface ResultChipProps {
  result: ResultType;
}

export function ResultChip({ result }: ResultChipProps) {
  const { colors, radius, space, type } = useTheme();

  let bg, textColor, dotColor, label;
  switch (result) {
    case 'flash':
      bg = colors.flashSoft; textColor = colors.flashText; dotColor = colors.flash; label = 'Flash'; break;
    case 'top':
      bg = colors.topSoft; textColor = colors.topText; dotColor = colors.top; label = 'Top'; break;
    case 'attempt':
    default:
      bg = colors.attemptSoft; textColor = colors.attemptText; dotColor = colors.attempt; label = 'Attempt'; break;
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: bg,
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginRight: 6 }} />
      <Text style={[{ color: textColor }, type.caption, { fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}
