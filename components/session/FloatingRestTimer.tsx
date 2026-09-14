import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import { useRestTimer } from '../../hooks/useRestTimer';
import { triggerHaptic } from '../../utils/haptics';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function FloatingRestTimer() {
  // Drive the rest timer tick
  useRestTimer();

  const restTimerActive  = useSessionStore((s) => s.restTimerActive);
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds);
  const dismissRestTimer = useSessionStore((s) => s.dismissRestTimer);
  const triggerRestTimer = useSessionStore((s) => s.triggerRestTimer);
  const insets = useSafeAreaInsets();

  // Pulse animation for the Lavender dot
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

  if (!restTimerActive) return null;

  const m = Math.floor(restTimerSeconds / 60);
  const s = restTimerSeconds % 60;

  const handleAdd30 = () => {
    triggerHaptic('light');
    triggerRestTimer(restTimerSeconds + 30);
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    dismissRestTimer();
  };

  return (
    <View
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom + 16, 24) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {/* Pulsing Lavender Dot */}
        <Animated.View style={[styles.pulseDot, pulseStyle]} />

        {/* Countdown Timer Text: 14pt Bold White */}
        <Text style={styles.timerText}>
          REST {pad(m)}:{pad(s)}
        </Text>

        {/* Quick +30s Add Button */}
        <TouchableOpacity
          onPress={handleAdd30}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>+30s</Text>
        </TouchableOpacity>

        {/* Dismiss 'X' Button */}
        <TouchableOpacity
          onPress={handleDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
          style={styles.closeBtn}
        >
          <X size={13} color="#8A8A98" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#8E7CFF',
    borderRadius: 999,
    paddingHorizontal: 20, // px-5 (20pt)
    paddingVertical: 10,  // py-2.5 (10pt)
    gap: 10,
    shadowColor: '#8E7CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E7CFF',
    shadowColor: '#8E7CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  addBtn: {
    backgroundColor: 'rgba(142, 124, 255, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
    marginLeft: 2,
  },
  addBtnText: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#17171C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
