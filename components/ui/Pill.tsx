import React from 'react';
import { View, Text } from 'react-native';

interface PillProps {
  label: string;
  bgColor?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Pill({ label, bgColor = '#374151', textColor = '#9CA3AF', size = 'sm' }: PillProps) {
  return (
    <View
      style={{ backgroundColor: bgColor }}
      className={`rounded-full items-center justify-center px-2.5 ${size === 'sm' ? 'py-1' : 'py-1.5'}`}
    >
      <Text
        style={{ color: textColor }}
        className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      >
        {label}
      </Text>
    </View>
  );
}
