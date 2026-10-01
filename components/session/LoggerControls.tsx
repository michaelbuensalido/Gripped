import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Zap, Flame } from 'lucide-react-native';

interface LoggerControlsProps {
  onAttempt: () => void;
  onSend: () => void;
}

// ─── Attempt Block ─────────────────────────────────────────────────────────────
// Triggers on: Tap or Long Press
// Haptic: Heavy Impact
function AttemptBlock({ onAttempt }: { onAttempt: () => void }) {
  const fired = useRef(false);

  const fire = () => {
    if (fired.current) return;
    fired.current = true;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_) {}
    onAttempt();
    setTimeout(() => {
      fired.current = false;
    }, 250);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={fire}
      onLongPress={fire}
      delayLongPress={300}
      style={styles.attemptBlock}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Log Attempt (Burn)"
    >
      <View style={styles.hintRow}>
        <Flame size={12} color="#FF5C5C" strokeWidth={2.5} />
        <Text style={styles.swipeHint}>TAP TO LOG</Text>
      </View>
      <Text style={styles.attemptLabel}>BURN</Text>
      <Text style={styles.attemptSub}>+1 attempt</Text>
    </TouchableOpacity>
  );
}

// ─── Send Block ────────────────────────────────────────────────────────────────
// Triggers on: Tap or Long Press
// Haptic: Success Notification
function SendBlock({ onSend }: { onSend: () => void }) {
  const fired = useRef(false);

  const fire = () => {
    if (fired.current) return;
    fired.current = true;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    onSend();
    setTimeout(() => {
      fired.current = false;
    }, 250);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={fire}
      onLongPress={fire}
      delayLongPress={300}
      style={styles.sendBlock}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Log Send (Top-Out)"
    >
      <View style={styles.hintRow}>
        <Zap size={12} color="#8E7CFF" strokeWidth={2.5} />
        <Text style={styles.swipeHintSend}>TAP TO TOP</Text>
      </View>
      <Text style={styles.sendLabel}>SEND</Text>
      <Text style={styles.sendSub}>top-out</Text>
    </TouchableOpacity>
  );
}

// ─── Compound Export ───────────────────────────────────────────────────────────
export function LoggerControls({ onAttempt, onSend }: LoggerControlsProps) {
  return (
    <View style={styles.root}>
      <AttemptBlock onAttempt={onAttempt} />
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
    backgroundColor: '#111113',
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },

  // ─── Attempt ───────────────────────────────────────────────────────────────
  attemptBlock: {
    flex: 1,
    minHeight: 96,
    backgroundColor: '#141417',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 2,
  },
  attemptLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D4D4DC',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  attemptSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#70707E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  swipeHint: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5C5C',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ─── Divider ───────────────────────────────────────────────────────────────
  divider: {
    width: 1,
    backgroundColor: '#27272F',
  },

  // ─── Send ──────────────────────────────────────────────────────────────────
  sendBlock: {
    flex: 1,
    minHeight: 96,
    backgroundColor: '#16141F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 2,
  },
  sendLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: '#8E7CFF',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  sendSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E7CFF',
    opacity: 0.7,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  swipeHintSend: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E7CFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
