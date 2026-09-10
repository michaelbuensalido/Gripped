import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X as XIcon } from 'lucide-react-native';
import { useSessionStore, selectTotalSends } from '../../store/sessionStore';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { RestTimerPill } from './RestTimerPill';

interface SessionHeaderProps {
  onFinish: () => void;
}

export function SessionHeader({ onFinish }: SessionHeaderProps) {
  const insets = useSafeAreaInsets();
  const activeSession = useSessionStore((s) => s.activeSession);
  const totalSends = useSessionStore(selectTotalSends);
  const restTimerActive = useSessionStore((s) => s.restTimerActive);
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds);

  const elapsed = useSessionTimer(
    activeSession?.startTime ?? null,
    activeSession?.endTime ?? null
  );

  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="bg-surface border-b border-border px-4 pb-3"
    >
      {/* Top row: timer + finish */}
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-3xl font-black tracking-tight font-mono">
          {elapsed}
        </Text>
        <TouchableOpacity
          onPress={onFinish}
          activeOpacity={0.8}
          className="bg-red-600 px-4 py-2 rounded-xl"
        >
          <Text className="text-white font-bold text-sm">Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom row: stats */}
      <View className="flex-row items-center gap-3 mt-2">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-send" />
          <Text className="text-secondary text-sm">
            <Text className="text-white font-bold">{totalSends}</Text> sends
          </Text>
        </View>
        <RestTimerPill seconds={restTimerSeconds} active={restTimerActive} />
      </View>
    </View>
  );
}
