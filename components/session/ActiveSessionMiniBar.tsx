import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronUp, Trash2 } from 'lucide-react-native';
import { useSessionStore, selectTotalSends } from '../../store/sessionStore';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { useRestTimer } from '../../hooks/useRestTimer';
import { triggerHaptic } from '../../utils/haptics';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

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
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6EE756',
        opacity,
        marginRight: 8,
        shadowColor: '#6EE756',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      }}
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

  const elapsed = useSessionTimer(
    activeSession?.startTime ?? null,
    activeSession?.endTime ?? null
  );

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

  // Format rest timer
  const restM = Math.floor(restTimerSeconds / 60);
  const restS = restTimerSeconds % 60;
  const restLabel = `⏱ ${pad(restM)}:${pad(restS)}`;

  // Position: float above 64pt tab bar + bottom insets + 8pt gap
  const tabBarHeight = 64;
  const tabBarBottom = Math.max(insets.bottom, 16);
  const bottomPosition = tabBarBottom + tabBarHeight + 8;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        triggerHaptic('light');
        router.push(`/session/${activeSession.id}`);
      }}
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: bottomPosition,
        backgroundColor: 'rgba(28, 28, 35, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.10)',
        borderTopColor: 'rgba(255, 255, 255, 0.20)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      {/* Left: pulsing dot + elapsed timer */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PulsingDot />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
            letterSpacing: 0.5,
          }}
        >
          {elapsed}
        </Text>
      </View>

      {/* Center: zone count + send tally */}
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 6 }}>
        <Text
          style={{
            color: '#9A9AA6',
            fontSize: 12,
            fontWeight: '500',
          }}
          numberOfLines={1}
        >
          {zoneSummary}
        </Text>
      </View>

      {/* Right: rest chip + discard button + expand chevron */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        {/* 1. Rest timer chip (if active) */}
        {restTimerActive && (
          <View
            style={{
              backgroundColor: 'rgba(110, 231, 86, 0.15)',
              borderColor: 'rgba(110, 231, 86, 0.35)',
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: '#6EE756',
                fontSize: 11,
                fontWeight: '700',
                fontVariant: ['tabular-nums'],
              }}
            >
              {restLabel}
            </Text>
          </View>
        )}

        {/* 2. Delete / Discard Button with isolated touch */}
        <Pressable
          onPress={handleDiscardPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: pressed
              ? 'rgba(255, 92, 92, 0.22)'
              : 'rgba(255, 92, 92, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Trash2 size={16} color="#FF5C5C" />
        </Pressable>

        {/* 3. Expand Button */}
        <View
          style={{
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronUp size={20} color="#8E7CFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
