import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { useSessionStore, selectTotalSends } from '../../store/sessionStore';
import { useSessionTimer } from '../../hooks/useSessionTimer';


interface SessionHeaderProps {
  onFinish: () => void;
  onMinimize?: () => void;
}

export function SessionHeader({ onFinish, onMinimize }: SessionHeaderProps) {
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
      style={{
        paddingTop: insets.top + 8,
        backgroundColor: 'rgba(26, 26, 32, 0.88)',
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        borderBottomWidth: 1,
      }}
      className="px-4 pb-3"
    >
      {/* Top row: minimize + timer + finish */}
      <View className="flex-row items-center justify-between">
        {/* Minimize button — 44x44pt tap target */}
        <TouchableOpacity
          onPress={onMinimize}
          activeOpacity={0.7}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronDown size={22} color="#8A8A98" />
        </TouchableOpacity>

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
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8E7CFF' }} />
          <Text className="text-secondary text-sm">
            <Text className="text-white font-bold">{totalSends}</Text> sends
          </Text>
        </View>

      </View>
    </View>
  );
}
