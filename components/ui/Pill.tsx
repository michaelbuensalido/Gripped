import React from 'react';
import { View, Text } from 'react-native';

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
  let bg = bgColor;
  let text = textColor;

  if (!bg) {
    if (variant === 'grade') {
      bg = '#6EE756';
      text = text || '#111115';
    } else if (variant === 'lavender') {
      bg = 'rgba(142, 124, 255, 0.16)';
      text = text || '#8E7CFF';
    } else {
      bg = '#1E1E24';
      text = text || '#9A9AA6';
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
