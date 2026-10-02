import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { ConfettiOverlay } from './ConfettiOverlay';
import { triggerHaptic } from '../../utils/haptics';

export interface CelebrationContextType {
  triggerSmall: () => void;
  triggerMedium: (message: string) => void;
  triggerBig: (data: { nickname: string; gradeRaw: string; burns: number; sessions: number }) => void;
  triggerStreak: (weeks: number) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export const useCelebration = () => {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebration must be used within CelebrationProvider');
  return ctx;
};

export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [streakToast, setStreakToast] = useState<number | null>(null);
  const [bigData, setBigData] = useState<{ nickname: string; gradeRaw: string; burns: number; sessions: number } | null>(null);
  const [confetti, setConfetti] = useState(false);

  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const streakTimer = useRef<NodeJS.Timeout | null>(null);
  const bigTimer = useRef<NodeJS.Timeout | null>(null);
  const confettiTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerSmall = useCallback(() => {
    triggerHaptic('impactLight');
    setConfetti(true);
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setConfetti(false), 3000);
  }, []);

  const triggerMedium = useCallback((message: string) => {
    triggerHaptic('notificationSuccess');
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const triggerBig = useCallback((data: { nickname: string; gradeRaw: string; burns: number; sessions: number }) => {
    triggerHaptic('notificationSuccess');
    setBigData(data);
    setConfetti(true);
    if (bigTimer.current) clearTimeout(bigTimer.current);
    bigTimer.current = setTimeout(() => {
      setBigData(null);
      setConfetti(false);
    }, 5000);
  }, []);

  const triggerStreak = useCallback((weeks: number) => {
    triggerHaptic('notificationSuccess');
    setStreakToast(weeks);
    setConfetti(true);
    if (streakTimer.current) clearTimeout(streakTimer.current);
    streakTimer.current = setTimeout(() => {
      setStreakToast(null);
      setConfetti(false);
    }, 4000);
  }, []);

  const closeBig = () => {
    triggerHaptic('impactLight');
    setBigData(null);
    setConfetti(false);
    if (bigTimer.current) clearTimeout(bigTimer.current);
  };

  return (
    <CelebrationContext.Provider value={{ triggerSmall, triggerMedium, triggerBig, triggerStreak }}>
      {children}
      
      <ConfettiOverlay active={confetti} />
      
      {toast && (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          accessibilityLiveRegion="polite"
          className="absolute bottom-24 self-center bg-surface border border-border px-4 py-2 rounded-full"
          pointerEvents="none"
        >
          <Text className="text-primary font-medium">{toast}</Text>
        </Animated.View>
      )}

      {streakToast !== null && (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          accessibilityLiveRegion="polite"
          className="absolute bottom-32 self-center bg-send px-4 py-2 rounded-full"
          pointerEvents="none"
        >
          <Text className="text-primary font-bold">{streakToast} Week Streak! 🔥</Text>
        </Animated.View>
      )}

      {bigData && (
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          className="absolute inset-0 justify-center items-center p-6"
          pointerEvents="box-none"
        >
          <View className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm items-center">
            <TouchableOpacity 
              onPress={closeBig} 
              className="absolute top-4 right-4 p-2 bg-recessed rounded-full"
            >
              <X size={20} color="#9090A0" />
            </TouchableOpacity>

            <Text className="text-send font-bold text-lg mb-1">SENT!</Text>
            <Text className="text-primary font-bold text-3xl mb-4">{bigData.nickname}</Text>
            
            <View className="flex-row justify-around w-full mt-4">
              <View className="items-center">
                <Text className="text-secondary text-sm">Grade</Text>
                <Text className="text-flash font-bold text-xl">{bigData.gradeRaw}</Text>
              </View>
              <View className="items-center">
                <Text className="text-secondary text-sm">Burns</Text>
                <Text className="text-primary font-bold text-xl">{bigData.burns}</Text>
              </View>
              <View className="items-center">
                <Text className="text-secondary text-sm">Sessions</Text>
                <Text className="text-primary font-bold text-xl">{bigData.sessions}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </CelebrationContext.Provider>
  );
};
