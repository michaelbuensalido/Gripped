import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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

const FAILURE_TAGS: TagOption[] = [
  { key: 'foot_slip', label: 'Foot Slip' },
  { key: 'pumped', label: 'Pumped' },
  { key: 'beta_error', label: 'Beta Error' },
  { key: 'reach_span', label: 'Reach / Span' },
  { key: 'grip_strength', label: 'Grip' },
];

export function FailureTagSelector({
  selectedReason,
  onSelectReason,
}: FailureTagSelectorProps) {
  const handlePress = (key: FailureReason) => {
    triggerHaptic('light');
    if (selectedReason === key) {
      onSelectReason(null);
    } else {
      onSelectReason(key);
    }
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#17171C',
    borderColor: '#22222A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipUnselected: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
  },
  chipSelected: {
    backgroundColor: 'rgba(142, 124, 255, 0.16)',
    borderWidth: 1,
    borderColor: '#8E7CFF',
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
    color: '#8A8A98',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#8E7CFF',
    fontWeight: '700',
  },
});
