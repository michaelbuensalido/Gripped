import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X as XIcon, SkipForward } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import { useRestTimer } from '../../hooks/useRestTimer';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function FloatingRestTimer() {
  // Drive the rest timer tick
  useRestTimer();

  const restTimerActive  = useSessionStore((s) => s.restTimerActive);
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds);
  const restTimerMax     = useSessionStore((s) => s.restTimerMax);
  const dismissRestTimer = useSessionStore((s) => s.dismissRestTimer);
  const triggerRestTimer = useSessionStore((s) => s.triggerRestTimer);

  const progress = restTimerMax > 0 ? restTimerSeconds / restTimerMax : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const m = Math.floor(restTimerSeconds / 60);
  const s = restTimerSeconds % 60;

  // Color shifts from green → yellow → red as time decreases
  const ringColor =
    progress > 0.5 ? '#22C55E' : progress > 0.25 ? '#F59E0B' : '#EF4444';

  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={restTimerActive}
      transparent
      animationType="fade"
      onRequestClose={dismissRestTimer}
    >
      <View className="flex-1 bg-black/70 items-center justify-center">
        <View
          style={{ paddingBottom: insets.bottom + 8 }}
          className="bg-surface rounded-3xl p-8 items-center mx-6 border border-border"
        >
          <Text className="text-secondary text-sm font-semibold mb-6 uppercase tracking-widest">
            Rest
          </Text>

          {/* Circular ring */}
          <View className="items-center justify-center">
            <Svg width={160} height={160}>
              {/* Background track */}
              <Circle
                cx={80}
                cy={80}
                r={RADIUS}
                stroke="#2E2E2E"
                strokeWidth={8}
                fill="none"
              />
              {/* Progress arc */}
              <Circle
                cx={80}
                cy={80}
                r={RADIUS}
                stroke={ringColor}
                strokeWidth={8}
                fill="none"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin="80, 80"
              />
            </Svg>
            {/* Centered time text */}
            <View className="absolute items-center">
              <Text className="text-white text-4xl font-black font-mono">
                {pad(m)}:{pad(s)}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-4 mt-8">
            <TouchableOpacity
              onPress={dismissRestTimer}
              activeOpacity={0.8}
              className="flex-row items-center gap-2 bg-card border border-border px-5 py-3 rounded-xl"
            >
              <SkipForward size={16} color="#9CA3AF" />
              <Text className="text-secondary font-semibold">Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => triggerRestTimer(90)}
              activeOpacity={0.8}
              className="flex-row items-center gap-2 bg-accent px-5 py-3 rounded-xl"
            >
              <Text className="text-white font-bold">+90s</Text>
            </TouchableOpacity>
          </View>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={dismissRestTimer}
            activeOpacity={0.7}
            className="mt-5"
          >
            <XIcon size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
