import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface LoggerControlsProps {
  onAttempt: () => void;
  onSend: () => void;
}

// ─── Attempt Block ─────────────────────────────────────────────────────────────
// Triggers on: Swipe Left OR Long Press
// Haptic: Heavy Impact

function AttemptBlock({ onAttempt }: { onAttempt: () => void }) {
  const fired = React.useRef(false);

  const fire = () => {
    if (fired.current) return;
    fired.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAttempt();
    // Reset guard after gesture window
    setTimeout(() => { fired.current = false; }, 600);
  };

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => { 'worklet'; fire(); });

  const swipeLeft = Gesture.Pan()
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -40 && Math.abs(e.translationY) < 60) {
        fire();
      }
    });

  const composed = Gesture.Race(longPress, swipeLeft);

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.attemptBlock} accessible accessibilityLabel="Log Attempt">
        {/* Faint direction indicator */}
        <Text style={styles.swipeHint}>← SWIPE  OR  HOLD</Text>
        <Text style={styles.attemptLabel}>BURN</Text>
        <Text style={styles.attemptSub}>attempt</Text>
      </View>
    </GestureDetector>
  );
}

// ─── Send Block ────────────────────────────────────────────────────────────────
// Triggers on: Swipe Right OR Single Tap
// Haptic: Success Notification

function SendBlock({ onSend }: { onSend: () => void }) {
  const fired = React.useRef(false);

  const fire = () => {
    if (fired.current) return;
    fired.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSend();
    setTimeout(() => { fired.current = false; }, 600);
  };

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => { 'worklet'; fire(); });

  const swipeRight = Gesture.Pan()
    .onEnd((e) => {
      'worklet';
      if (e.translationX > 40 && Math.abs(e.translationY) < 60) {
        fire();
      }
    });

  const composed = Gesture.Race(tap, swipeRight);

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.sendBlock} accessible accessibilityLabel="Log Send">
        <Text style={styles.swipeHintSend}>SWIPE  OR  TAP →</Text>
        <Text style={styles.sendLabel}>SEND</Text>
        <Text style={styles.sendSub}>top-out</Text>
      </View>
    </GestureDetector>
  );
}

// ─── Compound Export ───────────────────────────────────────────────────────────

export function LoggerControls({ onAttempt, onSend }: LoggerControlsProps) {
  return (
    <View style={styles.root}>
      <AttemptBlock onAttempt={onAttempt} />
      {/* 1px vertical divider */}
      <View style={styles.divider} />
      <SendBlock onSend={onSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272F',
  },

  // ─── Attempt ───────────────────────────────────────────────────────────────
  attemptBlock: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#141417',
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 4,
  },
  attemptLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8A8A98',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  attemptSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555562',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  swipeHint: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3E3E48',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // ─── Divider ───────────────────────────────────────────────────────────────
  divider: {
    width: 1,
    backgroundColor: '#27272F',
  },

  // ─── Send ──────────────────────────────────────────────────────────────────
  sendBlock: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#8E7CFF',
    // Override to kill the left border duplicate with divider
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 4,
  },
  sendLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8E7CFF',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  sendSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E7CFF',
    opacity: 0.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  swipeHintSend: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3E3E48',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
});
