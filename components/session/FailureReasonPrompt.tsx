import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FailureReason } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAILURE_OPTIONS: FailureOption[] = [
  { key: 'pump',       label: 'PUMP',       sublabel: 'Forearm pump / endurance', icon: '🔥' },
  { key: 'foot_slip',  label: 'FOOT SLIP',  sublabel: 'Foot cut or smear',        icon: '🦶' },
  { key: 'power',      label: 'POWER',      sublabel: 'Contact / raw strength',   icon: '💪' },
  { key: 'beta_error', label: 'BETA ERROR', sublabel: 'Wrong sequence or move',   icon: '🧠' },
  { key: 'fear',       label: 'FEAR',       sublabel: 'Mental / commitment',      icon: '😤' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function FailureReasonPrompt({
  visible,
  onSelect,
  onDismiss,
}: FailureReasonPromptProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<FailureReason | null>(null);

  const handleOptionPress = (key: FailureReason) => {
    triggerHaptic('medium');
    setSelected(key);
    // Fire immediately — caller handles dismissal
    onSelect(key);
  };

  const handleSkip = () => {
    triggerHaptic('light');
    setSelected(null);
    onDismiss();
  };

  const handleOverlayPress = () => {
    triggerHaptic('light');
    onDismiss();
  };

  // Split into rows of 2; last button is centred if odd count
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
      {/* Scrim */}
      <Pressable style={styles.scrim} onPress={handleOverlayPress} />

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <Text style={styles.eyebrow}>ROOT CAUSE</Text>
        <Text style={styles.title}>Why did you fall?</Text>

        {/* Option grid */}
        <View style={styles.grid}>
          {rows.map((row, rowIdx) => {
            const isSingleItem = row.length === 1;
            return (
              <View
                key={rowIdx}
                style={[styles.row, isSingleItem && styles.rowCentered]}
              >
                {row.map((opt) => {
                  const isSelected = selected === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.75}
                      onPress={() => handleOptionPress(opt.key)}
                      style={[
                        styles.optionBtn,
                        isSingleItem && styles.optionBtnSingle,
                        isSelected && styles.optionBtnSelected,
                      ]}
                    >
                      <Text style={styles.optionIcon}>{opt.icon}</Text>
                      <Text style={styles.optionLabel}>{opt.label}</Text>
                      <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
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
          style={styles.skipBtn}
        >
          <Text style={styles.skipLabel}>SKIP — LOG WITHOUT REASON</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// StyleSheet is used here because the sheet requires borderTopLeftRadius /
// borderTopRightRadius values (28) that NativeWind's rounded-* scale doesn't
// expose directly, and paddingBottom is dynamic (safe-area inset).

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#19191D',    // bg-surface
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#27272F',         // border-border
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3E3E48',     // bg-attempt
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    color: '#555562',               // text-structural
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',               // text-primary
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    gap: 10,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowCentered: {
    justifyContent: 'center',
  },
  optionBtn: {
    flex: 1,
    backgroundColor: '#141417',     // bg-recessed
    borderWidth: 1,
    borderColor: '#22222A',          // border-borderRecessed
    borderRadius: 16,               // rounded-2xl
    padding: 16,
    alignItems: 'center',
  },
  optionBtnSingle: {
    flex: 0,
    width: '48%',
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)', // bg-alert/15
    borderColor: '#FF453A',          // border-alert
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionLabel: {
    color: '#FFFFFF',               // text-primary
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  optionSublabel: {
    color: '#9090A0',               // text-secondary
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  skipBtn: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  skipLabel: {
    color: '#555562',               // text-structural
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
