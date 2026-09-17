import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
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
  const activeSession  = useSessionStore((s) => s.activeSession);
  const totalSends     = useSessionStore(selectTotalSends);

  const elapsed = useSessionTimer(
    activeSession?.startTime ?? null,
    activeSession?.endTime ?? null
  );

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-[#111113] border-b border-[#1E1E24]"
    >
      <View className="flex-row items-center justify-between px-5 py-4">
        {/* Minimize */}
        <TouchableOpacity
          onPress={onMinimize}
          activeOpacity={0.7}
          className="w-[40px] h-[40px] bg-[#19191D] border border-[#27272F] rounded-xl items-center justify-center"
        >
          <ChevronDown size={20} color="#9090A0" />
        </TouchableOpacity>

        {/* Center Timer Container */}
        <View className="flex-row items-baseline gap-2">
          {/* Elapsed clock */}
          <Text 
            className="text-3xl font-bold text-white" 
            style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
          >
            {elapsed}
          </Text>

          {/* Sends count */}
          <Text 
            className="text-[12px] text-[#8A8A98]"
            style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
          >
            {totalSends} SENDS
          </Text>
        </View>

        {/* Finish */}
        <TouchableOpacity
          onPress={onFinish}
          activeOpacity={0.8}
          className="h-[38px] px-4 bg-[#FF453A] rounded-xl items-center justify-center"
        >
          <Text className="text-white text-[12px] font-bold uppercase tracking-wider">FINISH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
