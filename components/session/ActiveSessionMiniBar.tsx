import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated, Alert, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { useSessionStore, selectTotalSends } from '../../store/sessionStore';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { useRestTimer } from '../../hooks/useRestTimer';
import { triggerHaptic } from '../../utils/haptics';


/** Pulsing green indicator dot for active session */
function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.pulsingDot,
        { opacity }
      ]}
    />
  );
}

/**
 * Global floating mini-bar that appears above the tab bar whenever there is an
 * active session and the user is NOT on the session screen itself.
 * Tap → navigates back to the full session screen.
 * Discard → Prompts confirmation and cancels the workout directly.
 */
export function ActiveSessionMiniBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Drive global rest timer countdown when away from full session screen
  useRestTimer();

  const activeSession = useSessionStore((s) => s.activeSession);
  const groups = useSessionStore((s) => s.groups);
  const totalSends = useSessionStore(selectTotalSends);
  const restTimerActive = useSessionStore((s) => s.restTimerActive);
  const restTimerSeconds = useSessionStore((s) => s.restTimerSeconds);

  const cancelSession = useSessionStore((s) => s.cancelSession);

  const elapsedRaw = useSessionTimer(
    activeSession?.startTime ?? null,
    activeSession?.endTime ?? null
  );

  let formattedElapsed = elapsedRaw;
  const timeParts = elapsedRaw.split(':');
  if (timeParts.length === 3) {
    const h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    const s = timeParts[2];
    if (h > 0) {
      formattedElapsed = `${h}h ${m}m ${s}s`;
    } else {
      formattedElapsed = `${m}m ${s}s`;
    }
  }

  const restM = Math.floor(restTimerSeconds / 60);
  const restS = (restTimerSeconds % 60).toString().padStart(2, '0');
  const formattedRest = `${restM}m ${restS}s`;

  const handleDiscardSession = useCallback(() => {
    if (!activeSession) return;
    triggerHaptic('warning');
    cancelSession(activeSession.id);
  }, [cancelSession, activeSession]);

  const handleDiscardPress = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      triggerHaptic('warning');
      Alert.alert(
        'Discard Session?',
        'Are you sure you want to cancel this workout? All progress and logged sends will be permanently deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: handleDiscardSession,
          },
        ]
      );
    },
    [handleDiscardSession]
  );

  // Hide if no active session, or if already on the session screen
  const isOnSessionScreen = pathname.startsWith('/session/') && !pathname.includes('/detail/');
  if (!activeSession || isOnSessionScreen) return null;

  const zoneCount = groups.length;
  const zoneSummary =
    zoneCount === 1 && groups[0]?.zoneName
      ? `${groups[0].zoneName} • ${totalSends} ${totalSends === 1 ? 'send' : 'sends'}`
      : `${zoneCount} ${zoneCount === 1 ? 'zone' : 'zones'} • ${totalSends} ${totalSends === 1 ? 'send' : 'sends'}`;



  // Position: float above 64pt tab bar (which has bottom: 24) + 16pt gap
  const bottomPosition = 24 + 64 + 16;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => {
        triggerHaptic('light');
        router.push(`/session/${activeSession.id}`);
      }}
      style={[
        styles.container,
        { bottom: bottomPosition }
      ]}
    >
      <View style={styles.leftContent}>
        <View style={styles.dotContainer}>
          <PulsingDot />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.elapsedText}>
            {restTimerActive ? `Rest ${formattedRest}` : `Session ${formattedElapsed}`}
          </Text>
          <Text style={styles.summaryText} numberOfLines={1}>
            {zoneSummary}
          </Text>
        </View>
      </View>

      <View style={styles.rightContent}>

        <Pressable
          onPress={handleDiscardPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [
            styles.discardButton,
            pressed ? styles.discardButtonPressed : undefined
          ]}
        >
          <Trash2 size={18} color="#FF5C5C" />
        </Pressable>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(32, 32, 40, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dotContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6EE756',
    shadowColor: '#6EE756',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  textContent: {
    flex: 1,
  },
  elapsedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryText: {
    color: '#9A9AA6',
    fontSize: 13,
    fontWeight: '500',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 12,
  },

  discardButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 92, 92, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonPressed: {
    backgroundColor: 'rgba(255, 92, 92, 0.2)',
  },
});
