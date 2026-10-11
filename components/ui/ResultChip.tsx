import React from 'react';
import { View, Text } from 'react-native';
import { Zap, Check, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

export type ResultType = 'flash' | 'top' | 'attempt';

interface ResultChipProps {
  result: ResultType;
}

export function ResultChip({ result }: ResultChipProps) {
  const { colors, radius, space, type } = useTheme();

  let bg: string, textColor: string, icon: React.ReactNode, label: string;
  switch (result) {
    case 'flash':
      bg = colors.flashSoft;
      textColor = colors.flashText;
      label = 'Flash';
      icon = <Zap size={11} color={colors.flash} strokeWidth={2.5} style={{ marginRight: 4 }} />;
      break;
    case 'top':
      bg = colors.topSoft;
      textColor = colors.topText;
      label = 'Top';
      icon = <Check size={11} color={colors.top} strokeWidth={2.5} style={{ marginRight: 4 }} />;
      break;
    case 'attempt':
    default:
      bg = colors.attemptSoft;
      textColor = colors.attemptText;
      label = 'Attempt';
      icon = <RotateCcw size={10} color={colors.attempt} strokeWidth={2.5} style={{ marginRight: 4 }} />;
      break;
  }

  return (
    <View
      accessible={true}
      accessibilityLabel={`${label} outcome`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: bg,
        paddingHorizontal: space.sm,
        paddingVertical: space.xs,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      {icon}
      <Text style={[{ color: textColor }, type.caption, { fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}
