import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FailureReason } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { useTheme } from '../../theme/useTheme';

interface FailureReasonPromptProps {
  visible: boolean;
  onSelect: (reason: FailureReason | null) => void;
  onDismiss: () => void;
}

interface FailureOption {
  key: FailureReason;
  label: string;
  sublabel: string;
  icon: string;
}

const FAILURE_OPTIONS: FailureOption[] = [
  { key: 'pump',       label: 'PUMP',       sublabel: 'Forearm pump / endurance', icon: '🔥' },
  { key: 'foot_slip',  label: 'FOOT SLIP',  sublabel: 'Foot cut or smear',        icon: '🦶' },
  { key: 'power',      label: 'POWER',      sublabel: 'Contact / raw strength',   icon: '💪' },
  { key: 'beta_error', label: 'BETA ERROR', sublabel: 'Wrong sequence or move',   icon: '🧠' },
  { key: 'fear',       label: 'FEAR',       sublabel: 'Mental / commitment',      icon: '😤' },
];

export function FailureReasonPrompt({
  visible,
  onSelect,
  onDismiss,
}: FailureReasonPromptProps) {
  const insets = useSafeAreaInsets();
  const { colors, type, radius, space, shadow } = useTheme();
  const [selected, setSelected] = useState<FailureReason | null>(null);

  const handleOptionPress = (key: FailureReason) => {
    triggerHaptic('medium');
    setSelected(key);
    onSelect(key);
  };

  const handleSkip = () => {
    triggerHaptic('light');
    setSelected(null);
    onDismiss();
  };

  const rows: FailureOption[][] = [];
  for (let i = 0; i < FAILURE_OPTIONS.length; i += 2) {
    rows.push(FAILURE_OPTIONS.slice(i, i + 2));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={{ flex: 1, backgroundColor: colors.scrim }} onPress={handleSkip} />

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.card,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: Math.max(insets.bottom, 24),
          ...shadow.floating,
        }}
      >
        {/* Drag handle */}
        <View
          style={{
            width: 36,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: radius.pill,
            alignSelf: 'center',
            marginBottom: space.lg,
          }}
        />

        {/* Header */}
        <Text
          style={[
            type.label,
            {
              color: colors.attemptText,
              textAlign: 'center',
              marginBottom: 4,
              letterSpacing: 2,
            },
          ]}
        >
          ROOT CAUSE
        </Text>
        <Text
          style={[
            type.title,
            {
              color: colors.text,
              textAlign: 'center',
              marginBottom: space.xl,
            },
          ]}
        >
          Why did you fall?
        </Text>

        {/* Option grid */}
        <View style={{ gap: space.sm, marginBottom: space.xl }}>
          {rows.map((row, rowIdx) => {
            const isSingleItem = row.length === 1;
            return (
              <View
                key={rowIdx}
                style={{
                  flexDirection: 'row',
                  gap: space.sm,
                  justifyContent: isSingleItem ? 'center' : 'space-between',
                }}
              >
                {row.map((opt) => {
                  const isSelected = selected === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.75}
                      onPress={() => handleOptionPress(opt.key)}
                      style={{
                        flex: isSingleItem ? 0 : 1,
                        width: isSingleItem ? '48%' : undefined,
                        minHeight: 80,
                        backgroundColor: isSelected ? colors.attemptSoft : colors.cardMuted,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.attempt : colors.border,
                        borderRadius: radius.md,
                        padding: space.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</Text>
                      <Text
                        style={[
                          type.heading,
                          {
                            color: isSelected ? colors.attemptText : colors.text,
                            fontSize: 13,
                            marginBottom: 2,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          type.caption,
                          {
                            color: colors.textMuted,
                            fontSize: 10,
                            textAlign: 'center',
                          },
                        ]}
                      >
                        {opt.sublabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Skip */}
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
          style={{
            alignSelf: 'center',
            paddingVertical: space.sm,
          }}
        >
          <Text
            style={[
              type.label,
              {
                color: colors.textMuted,
                letterSpacing: 1.5,
              },
            ]}
          >
            SKIP — LOG WITHOUT REASON
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
