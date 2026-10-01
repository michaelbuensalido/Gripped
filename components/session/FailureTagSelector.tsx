import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import type { FailureReason } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface FailureTagSelectorProps {
  selectedReason: FailureReason | null;
  onSelectReason: (reason: FailureReason | null) => void;
}

interface TagOption {
  key: FailureReason;
  label: string;
}

// Keys align with the canonical FailureReason taxonomy and
// the FailureReasonPrompt bottom-sheet values.
const FAILURE_TAGS: TagOption[] = [
  { key: 'pump',       label: '🔥 Pump' },
  { key: 'foot_slip',  label: '🦶 Foot Slip' },
  { key: 'power',      label: '💪 Power' },
  { key: 'beta_error', label: '🧠 Beta Error' },
  { key: 'fear',       label: '😤 Fear' },
];

export function FailureTagSelector({
  selectedReason,
  onSelectReason,
}: FailureTagSelectorProps) {
  const handlePress = (key: FailureReason) => {
    triggerHaptic('light');
    // Toggle: pressing the active tag deselects it
    onSelectReason(selectedReason === key ? null : key);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify().damping(18)}
      style={styles.container}
    >
      {FAILURE_TAGS.map((tag) => {
        const isSelected = selectedReason === tag.key;
        return (
          <Pressable
            key={tag.key}
            onPress={() => handlePress(tag.key)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
              pressed && styles.chipPressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
              ]}
            >
              {tag.label}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// StyleSheet used here for dynamic transform (chipPressed scale) which
// cannot be expressed via NativeWind className on Pressable style callback.

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141417',     // bg-recessed
    borderColor: '#22222A',          // border-borderRecessed
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipUnselected: {
    backgroundColor: '#19191D',     // bg-surface
    borderWidth: 1,
    borderColor: '#27272F',          // border-border
  },
  chipSelected: {
    backgroundColor: 'rgba(142, 124, 255, 0.18)', // bg-send/18
    borderWidth: 1,
    borderColor: '#8E7CFF',          // border-send
  },
  chipPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  chipText: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
  chipTextUnselected: {
    color: '#9090A0',               // text-secondary
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#8E7CFF',               // text-send
    fontWeight: '700',
  },
});
