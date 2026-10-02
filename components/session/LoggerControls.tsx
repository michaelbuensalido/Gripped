import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Zap, Flame } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

interface LoggerControlsProps {
  onAttempt: () => void;
  onSend: () => void;
}

// ─── Attempt Block ─────────────────────────────────────────────────────────────
function AttemptBlock({ onAttempt }: { onAttempt: () => void }) {
  const { colors, type, radius } = useTheme();
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
      style={{
        flex: 1,
        minHeight: 72,
        backgroundColor: colors.attemptSoft,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 2,
      }}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Log Attempt (Burn)"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <Flame size={14} color={colors.attemptText} strokeWidth={2.5} />
        <Text style={[type.label, { color: colors.attemptText, fontSize: 10, letterSpacing: 1.2 }]}>
          +1 ATTEMPT
        </Text>
      </View>
      <Text style={[type.statSm, { color: colors.attemptText, letterSpacing: 2 }]}>
        BURN
      </Text>
    </TouchableOpacity>
  );
}

// ─── Send Block ────────────────────────────────────────────────────────────────
function SendBlock({ onSend }: { onSend: () => void }) {
  const { colors, type, radius } = useTheme();
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
      style={{
        flex: 1,
        minHeight: 72,
        backgroundColor: colors.accentSoft,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 2,
      }}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Log Send (Top-Out)"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <Zap size={14} color={colors.accentText} strokeWidth={2.5} />
        <Text style={[type.label, { color: colors.accentText, fontSize: 10, letterSpacing: 1.2 }]}>
          TOP-OUT
        </Text>
      </View>
      <Text style={[type.statSm, { color: colors.accentText, letterSpacing: 2 }]}>
        SEND
      </Text>
    </TouchableOpacity>
  );
}

// ─── Compound Export ───────────────────────────────────────────────────────────
export function LoggerControls({ onAttempt, onSend }: LoggerControlsProps) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      <AttemptBlock onAttempt={onAttempt} />
      <SendBlock onSend={onSend} />
    </View>
  );
}
