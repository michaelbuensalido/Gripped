import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import type { FailureReason } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { useTheme } from '../../theme/useTheme';

interface FailureTagSelectorProps {
  selectedReason: FailureReason | null;
  onSelectReason: (reason: FailureReason | null) => void;
}

interface TagOption {
  key: FailureReason;
  label: string;
}

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
  const { colors, radius, type, space } = useTheme();

  const handlePress = (key: FailureReason) => {
    triggerHaptic('light');
    onSelectReason(selectedReason === key ? null : key);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify().damping(18)}
      style={{
        backgroundColor: colors.cardMuted,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: space.sm,
        marginTop: space.xs,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: space.xs,
      }}
    >
      {FAILURE_TAGS.map((tag) => {
        const isSelected = selectedReason === tag.key;
        return (
          <Pressable
            key={tag.key}
            onPress={() => handlePress(tag.key)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              {
                paddingHorizontal: 12,
                height: 36,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? colors.attemptSoft : colors.card,
                borderWidth: 1,
                borderColor: isSelected ? colors.attempt : colors.border,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Text
              style={[
                type.control,
                {
                  fontSize: 12,
                  color: isSelected ? colors.attemptText : colors.textMuted,
                  fontWeight: isSelected ? '700' : '500',
                },
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
