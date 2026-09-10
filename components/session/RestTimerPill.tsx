import React from 'react';
import { View, Text } from 'react-native';
import { Timer } from 'lucide-react-native';

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
    <View className="flex-row items-center gap-1 bg-blue-900 px-2.5 py-1 rounded-full">
      <Timer size={11} color="#93C5FD" />
      <Text className="text-blue-300 text-xs font-bold">
        {pad(m)}:{pad(s)}
      </Text>
    </View>
  );
}
