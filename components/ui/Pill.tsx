import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface PillProps {
  label: string;
  bgColor?: string;
  textColor?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'grade' | 'lavender';
}

export function Pill({
  label,
  bgColor,
  textColor,
  size = 'sm',
  variant = 'default',
}: PillProps) {
  const { colors } = useTheme();
  let bg = bgColor;
  let text = textColor;

  if (!bg) {
    if (variant === 'grade') {
      bg = colors.flash;
      text = text || colors.textOnAccent;
    } else if (variant === 'lavender') {
      bg = colors.accentSoft;
      text = text || colors.accentText;
    } else {
      bg = colors.cardMuted;
      text = text || colors.textMuted;
    }
  }

  return (
    <View
      style={{ backgroundColor: bg }}
      className={`rounded-full items-center justify-center px-3 ${
        size === 'sm' ? 'py-1' : 'py-1.5'
      }`}
    >
      <Text
        style={{ color: text || '#FFFFFF' }}
        className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      >
        {label}
      </Text>
    </View>
  );
}
