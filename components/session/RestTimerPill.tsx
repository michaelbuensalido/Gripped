import React from 'react';
import { View, Text } from 'react-native';

interface RestTimerPillProps {
  seconds: number;
  active: boolean;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function RestTimerPill({ seconds, active }: RestTimerPillProps) {
  if (!active) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <View className="flex-row items-center bg-blue-900 px-2.5 py-1 rounded-full">
      <Text className="text-blue-300 text-xs font-bold font-mono">
        REST {pad(m)}:{pad(s)}
      </Text>
    </View>
  );
}
