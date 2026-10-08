import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Plus, X, Minus, ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { PrimaryButton } from '../ui/PrimaryButton';
import { ResultType } from '../ui/ResultChip';
import { GradePill } from '../ui/GradePill';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { FailureTagSelector } from './FailureTagSelector';
import type { FailureReason } from '../../types';

const GRADES = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16'];

function GradePicker({ value, onChange }: { value: string; onChange: (g: string) => void }) {
  const { colors, type, space, radius, gradeBand } = useTheme();
  const idx = Math.max(0, GRADES.indexOf(value));

  const prev = () => {
    if (idx > 0) {
      triggerHaptic('light');
      onChange(GRADES[idx - 1]);
    }
  };
  const next = () => {
    if (idx < GRADES.length - 1) {
      triggerHaptic('light');
      onChange(GRADES[idx + 1]);
    }
  };

  const band = gradeBand(idx);

  return (
    <View style={{ gap: space.sm }}>
      {/* Stepper Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <TouchableOpacity
          onPress={prev}
          disabled={idx === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous grade"
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 0,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: idx === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: band.bg,
            borderRadius: radius.pill,
            borderWidth: 0,
            borderColor: band.solid + '55',
          }}
        >
          <Text
            style={[
              type.stat,
              {
                color: band.text,
                fontSize: 28,
                letterSpacing: 0.5,
              },
            ]}
          >
            {value}
          </Text>
        </View>

        <TouchableOpacity
          onPress={next}
          disabled={idx === GRADES.length - 1}
          accessibilityRole="button"
          accessibilityLabel="Next grade"
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 0,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: idx === GRADES.length - 1 ? 0.3 : 1,
          }}
        >
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Quick Tap Grade Bar */}
      <Reanimated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.xs, paddingVertical: 2 }}
      >
        {GRADES.map((g, gIdx) => {
          const isSelected = g === value;
          const gBand = gradeBand(gIdx);
          return (
            <TouchableOpacity
              key={g}
              onPress={() => {
                triggerHaptic('light');
                onChange(g);
              }}
              style={{
                height: 48,
                minWidth: 48,
                paddingHorizontal: space.sm,
                borderRadius: radius.sm,
                backgroundColor: isSelected ? gBand.bg : colors.cardMuted,
                borderWidth: 0,
                borderColor: isSelected ? gBand.solid : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  type.heading,
                  {
                    color: isSelected ? gBand.text : colors.textMuted,
                    fontSize: 14,
                    fontVariant: ['tabular-nums'],
                  },
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Reanimated.ScrollView>
    </View>
  );
}

function ResultSelector({
  value,
  onChange,
  disableFlash = false,
}: {
  value: ResultType;
  onChange: (r: ResultType) => void;
  disableFlash?: boolean;
}) {
  const { colors, space, radius, type } = useTheme();
  const allOptions: { result: ResultType; label: string; color: string; bg: string; border: string; testID?: string }[] = [
    { result: 'flash', label: 'Flash', color: colors.flashText, bg: colors.flashSoft, border: colors.flash },
    { result: 'top',   label: 'Top',   color: colors.topText,   bg: colors.topSoft,   border: colors.top },
    { result: 'attempt', label: 'Attempt', color: colors.attemptText, bg: colors.attemptSoft, border: colors.attempt, testID: 'log-attempt-chip' },
  ];

  const options = disableFlash ? allOptions.filter(o => o.result !== 'flash') : allOptions;

  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      {options.map((o) => {
        const selected = value === o.result;
        return (
          <TouchableOpacity
            testID={o.testID}
            key={o.result}
            onPress={() => {
              triggerHaptic('light');
              onChange(o.result);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              height: 56,
              minHeight: 56,
              borderRadius: radius.pill,
              backgroundColor: selected ? o.bg : colors.cardMuted,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 0,
              borderColor: selected ? o.border : colors.border,
            }}
          >
            <Text
              style={[
                type.heading,
                {
                  color: selected ? o.color : colors.textMuted,
                  fontSize: 15,
                  letterSpacing: 0.3,
                },
              ]}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AttemptsStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { colors, space, radius, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <TouchableOpacity
        onPress={() => {
          if (value > 1) {
            triggerHaptic('light');
            onChange(value - 1);
          }
        }}
        disabled={value <= 1}
        accessibilityRole="button"
        accessibilityLabel="Decrease attempts"
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 0,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: value <= 1 ? 0.3 : 1,
        }}
      >
        <Minus size={22} color={colors.textWhitePrimary || colors.text} />
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          borderWidth: 0,
        }}
      >
        <Text style={[type.stat, { color: colors.textWhitePrimary || colors.text, fontSize: 32, fontWeight: '200' }]}>{value}</Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          triggerHaptic('light');
          onChange(value + 1);
        }}
        accessibilityRole="button"
        accessibilityLabel="Increase attempts"
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={22} color={colors.textWhitePrimary || colors.text} />
      </TouchableOpacity>
    </View>
  );
}

export function LogSheet({
  visible,
  onClose,
  onSave,
  initialGrade,
  initialResult,
  initialAttempts,
  initialNotes,
  lockGrade = false,
  disableFlash = false,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (grade: string, result: ResultType, attempts: number, notes: string) => void;
  initialGrade?: string;
  initialResult?: ResultType;
  initialAttempts?: number;
  initialNotes?: string;
  lockGrade?: boolean;
  disableFlash?: boolean;
  title?: string;
}) {
  const { colors, space, type, radius, shadow } = useTheme();
  const [grade, setGrade] = useState(initialGrade ?? 'V4');
  const [result, setResult] = useState<ResultType>(initialResult ?? 'top');
  const [attempts, setAttempts] = useState(initialAttempts ?? 1);
  const [failureReason, setFailureReason] = useState<FailureReason | null>(null);
  const [notes, setNotes] = useState(initialNotes ?? '');

  useEffect(() => {
    if (visible) {
      setGrade(initialGrade ?? 'V4');
      let defaultResult = initialResult ?? 'top';
      if (disableFlash && defaultResult === 'flash') {
        defaultResult = 'attempt';
      }
      setResult(defaultResult);
      setAttempts(initialAttempts ?? 1);
      setNotes(initialNotes ?? '');
      setFailureReason(null);
    }
  }, [visible, initialGrade, initialResult, initialAttempts, initialNotes, disableFlash]);

  useEffect(() => {
    if (result === 'flash') setAttempts(1);
  }, [result]);

  useEffect(() => {
    if (attempts > 1 && result === 'flash') {
      setResult('top');
    }
  }, [attempts, result]);

  const handleSave = () => {
    let finalNotes = notes.trim();
    if (result === 'attempt' && failureReason) {
      const reasonLabel = failureReason.replace('_', ' ').toUpperCase();
      finalNotes = finalNotes ? `[${reasonLabel}] ${finalNotes}` : `[${reasonLabel}]`;
    }
    onSave(grade, result, result === 'flash' ? 1 : attempts, finalNotes);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: space.lg,
                paddingTop: space.md,
                paddingBottom: space.xxl + 24,
                maxHeight: '92%',
                ...shadow.floating,
              }}
            >
              {/* Drag Handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: radius.pill,
                  backgroundColor: colors.border,
                  alignSelf: 'center',
                  marginBottom: space.md,
                }}
              />

              {/* Title & Close */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: space.lg,
                }}
              >
                <Text style={[type.title, { color: colors.text }]}>{title || 'Log Climb'}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                  <X size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Reanimated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.lg }}>
                {/* Result Section */}
                <View>
                  <SectionHeader title="Outcome" />
                  <ResultSelector
                    value={result}
                    onChange={setResult}
                    disableFlash={disableFlash || attempts > 1}
                  />
                </View>

                {/* Root Cause Failure tags if Attempt */}
                {result === 'attempt' && (
                  <View>
                    <SectionHeader title="Root Cause (Optional)" />
                    <FailureTagSelector
                      selectedReason={failureReason}
                      onSelectReason={setFailureReason}
                    />
                  </View>
                )}

                {/* Grade Section */}
                <View>
                  <SectionHeader title={lockGrade ? "Grade (Locked to Project)" : "Grade"} />
                  {lockGrade ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.cardMuted,
                        borderRadius: radius.md,
                        paddingHorizontal: space.md,
                        height: 56,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                        <GradePill gradeIndex={Math.max(0, GRADES.indexOf(grade))} label={grade} />
                        <Text style={[type.body, { color: colors.textMuted, fontSize: 13 }]}>
                          Fixed to project
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Lock size={14} color={colors.textMuted} />
                        <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>
                          LOCKED
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <GradePicker value={grade} onChange={setGrade} />
                  )}
                </View>

                {/* Attempts Stepper */}
                {result !== 'flash' && (
                  <View>
                    <SectionHeader title="Attempts (Burns)" />
                    <AttemptsStepper value={attempts} onChange={setAttempts} />
                  </View>
                )}

                {/* Notes Input */}
                <View>
                  <SectionHeader title="Notes (Optional)" />
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Beta, holds, sequence, feeling…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    style={[
                      type.body,
                      {
                        color: colors.text,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: radius.pill,
                        borderWidth: 0,
                        padding: space.md,
                        minHeight: 70,
                        textAlignVertical: 'top',
                      },
                    ]}
                  />
                </View>

                {/* Pinned Save Button */}
                <PrimaryButton
                  testID="save-climb-btn"
                  label="SAVE CLIMB"
                  onPress={handleSave}
                />
              </Reanimated.ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
