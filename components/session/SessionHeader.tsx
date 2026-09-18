import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, X } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { useSessionStore, selectTotalSends } from '../../store/sessionStore';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { useRestTimer } from '../../hooks/useRestTimer';
import { triggerHaptic } from '../../utils/haptics';

interface SessionHeaderProps {
  onFinish: () => void;
  onMinimize?: () => void;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function SessionHeader({ onFinish, onMinimize }: SessionHeaderProps) {
  const insets = useSafeAreaInsets();
  
  // Drive the rest timer tick
  useRestTimer();

  const activeSession    = useSessionStore((s) => s.activeSession);
  const totalSends       = useSessionStore(selectTotalSends);
  const restTimerActive  = useSessionStore((s) => s.restTimerActive);
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds);
  const dismissRestTimer = useSessionStore((s) => s.dismissRestTimer);
  const triggerRestTimer = useSessionStore((s) => s.triggerRestTimer);

  const elapsed = useSessionTimer(
    activeSession?.startTime ?? null,
    activeSession?.endTime ?? null
  );

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (restTimerActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [restTimerActive, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value > 1.1 ? 1 : 0.75,
  }));

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
        {restTimerActive ? (
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => {
              triggerHaptic('light');
              triggerRestTimer(restTimerSeconds + 30);
            }}
            onLongPress={() => {
              triggerHaptic('medium');
              dismissRestTimer();
            }}
            delayLongPress={400}
            className="flex-row items-center bg-[#19191D] px-4 py-1.5 rounded-full border border-[#E7AE56] gap-2"
          >
            <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E7AE56' }, pulseStyle]} />
            <Text 
              className="text-[16px] font-bold text-[#E7AE56]" 
              style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontVariant: ['tabular-nums'], letterSpacing: 1 }}
            >
              REST {pad(Math.floor(restTimerSeconds / 60))}:{pad(restTimerSeconds % 60)}
            </Text>
            <TouchableOpacity onPress={() => dismissRestTimer()} hitSlop={{top:10,bottom:10,left:10,right:10}} className="ml-1 bg-[#111113] rounded-full p-[2px]">
               <X size={12} color="#E7AE56" strokeWidth={3} />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
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
        )}

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
