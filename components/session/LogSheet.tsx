import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useReducedMotion,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Plus, X, Minus, ChevronLeft, ChevronRight, Lock, Target, FileText, Layers } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader } from '../ui/SectionHeader';
import { PrimaryButton } from '../ui/PrimaryButton';
import { ResultType } from '../ui/ResultChip';
import { GradePill } from '../ui/GradePill';
import { ScalePressable } from '../ui/ScalePressable';
import { Chip } from '../ui/Chip';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { usePreferences } from '../../utils/preferences';
import { FailureTagSelector } from './FailureTagSelector';
import type { FailureReason } from '../../types';

const GRADES = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16'];

const WALL_ANGLE_OPTIONS = [
  { key: 'slab', label: 'Slab' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'overhang', label: 'Overhang' },
  { key: 'roof', label: 'Roof' },
];

const HOLD_TYPE_OPTIONS = [
  { key: 'crimps', label: 'Crimps' },
  { key: 'slopers', label: 'Slopers' },
  { key: 'pinches', label: 'Pinches' },
  { key: 'jug', label: 'Jugs' },
  { key: 'volumes', label: 'Volumes' },
];

function GradePicker({ value, onChange }: { value: string; onChange: (g: string) => void }) {
  const { colors, type, space, radius, gradeBand } = useTheme();
  const { formatGrade } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);
  const idx = Math.max(0, GRADES.indexOf(value));

  useEffect(() => {
    const timer = setTimeout(() => {
      const targetX = Math.max(0, idx * 52 - 120);
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [idx]);

  const prev = () => {
    if (idx > 0) {
      onChange(GRADES[idx - 1]);
    }
  };
  const next = () => {
    if (idx < GRADES.length - 1) {
      onChange(GRADES[idx + 1]);
    }
  };

  const band = gradeBand(idx);
  const formattedSelected = formatGrade(idx, value);

  return (
    <View style={{ gap: space.sm }}>
      {/* Stepper Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <ScalePressable
          onPress={prev}
          disabled={idx === 0}
          haptic="light"
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityLabel="Previous grade"
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: idx === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </ScalePressable>

        <View
          accessibilityRole="adjustable"
          accessibilityLabel={`Grade ${formattedSelected}`}
          accessibilityValue={{ text: formattedSelected }}
          style={{
            flex: 1,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: band.bg,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: band.solid + '44',
          }}
        >
          <Text
            style={[
              type.stat,
              {
                color: band.text,
                fontSize: 28,
                letterSpacing: 0.5,
                fontWeight: '700',
              },
            ]}
          >
            {formattedSelected}
          </Text>
        </View>

        <ScalePressable
          onPress={next}
          disabled={idx === GRADES.length - 1}
          haptic="light"
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityLabel="Next grade"
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: idx === GRADES.length - 1 ? 0.3 : 1,
          }}
        >
          <ChevronRight size={24} color={colors.text} />
        </ScalePressable>
      </View>

      {/* Quick Tap Grade Bar */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.xs, paddingVertical: 2 }}
      >
        {GRADES.map((g, gIdx) => {
          const isSelected = g === value;
          const gBand = gradeBand(gIdx);
          return (
            <ScalePressable
              key={g}
              onPress={() => onChange(g)}
              haptic="light"
              activeScale={0.94}
              style={{
                height: 44,
                minWidth: 44,
                paddingHorizontal: space.sm + 2,
                borderRadius: radius.sm,
                backgroundColor: isSelected ? gBand.bg : colors.cardMuted,
                borderWidth: isSelected ? 1 : 0,
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
                    fontWeight: isSelected ? '700' : '400',
                    fontVariant: ['tabular-nums'],
                  },
                ]}
              >
                {formatGrade(gIdx, g)}
              </Text>
            </ScalePressable>
          );
        })}
      </ScrollView>
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
    { result: 'flash', label: 'Flash', color: colors.flashText, bg: colors.flashSoft, border: colors.flash, testID: 'log-flash-chip' },
    { result: 'top',   label: 'Top',   color: colors.topText,   bg: colors.topSoft,   border: colors.top, testID: 'log-top-chip' },
    { result: 'attempt', label: 'Attempt', color: colors.attemptText, bg: colors.attemptSoft, border: colors.attempt, testID: 'log-attempt-chip' },
  ];

  const options = disableFlash ? allOptions.filter(o => o.result !== 'flash') : allOptions;

  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      {options.map((o) => {
        const selected = value === o.result;
        return (
          <ScalePressable
            testID={o.testID}
            key={o.result}
            onPress={() => onChange(o.result)}
            haptic="medium"
            activeScale={0.96}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              height: 56,
              minHeight: 56,
              borderRadius: radius.pill,
              backgroundColor: selected ? o.bg : colors.cardMuted,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: selected ? 1 : 0,
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
                  fontWeight: selected ? '700' : '500',
                },
              ]}
            >
              {o.label}
            </Text>
          </ScalePressable>
        );
      })}
    </View>
  );
}

function AttemptsStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { colors, space, radius, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <ScalePressable
        onPress={() => {
          if (value > 1) onChange(value - 1);
        }}
        disabled={value <= 1}
        haptic="light"
        activeScale={0.92}
        accessibilityRole="button"
        accessibilityLabel="Decrease attempts"
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.06)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: value <= 1 ? 0.3 : 1,
        }}
      >
        <Minus size={22} color={colors.textWhitePrimary || colors.text} />
      </ScalePressable>

      <View
        accessibilityRole="adjustable"
        accessibilityLabel={`${value} attempts`}
        accessibilityValue={{ text: `${value} attempts`, min: 1, now: value }}
        style={{
          flex: 1,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          borderWidth: 0,
        }}
      >
        <Text style={[type.stat, { color: colors.textWhitePrimary || colors.text, fontSize: 32, fontWeight: '300' }]}>
          {value}
        </Text>
      </View>

      <ScalePressable
        onPress={() => onChange(value + 1)}
        haptic="light"
        activeScale={0.92}
        accessibilityRole="button"
        accessibilityLabel="Increase attempts"
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.06)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={22} color={colors.textWhitePrimary || colors.text} />
      </ScalePressable>
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
  initialFailureReason,
  initialWallAngle,
  initialHoldType,
  lockGrade = false,
  disableFlash = false,
  title,
  projects = [],
  selectedProject = null,
  onSelectProject,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (
    grade: string,
    result: ResultType,
    attempts: number,
    notes: string,
    failureReason?: FailureReason | null,
    project?: any | null,
    wallAngle?: string | null,
    holdType?: string | null
  ) => void;
  initialGrade?: string;
  initialResult?: ResultType;
  initialAttempts?: number;
  initialNotes?: string;
  initialFailureReason?: FailureReason | null;
  initialWallAngle?: string | null;
  initialHoldType?: string | null;
  lockGrade?: boolean;
  disableFlash?: boolean;
  title?: string;
  projects?: any[];
  selectedProject?: any | null;
  onSelectProject?: (proj: any | null) => void;
}) {
  const { colors, space, type, radius, shadow, motion } = useTheme();
  const { formatGradeLabel } = usePreferences();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [grade, setGrade] = useState(initialGrade ?? 'V4');
  const [result, setResult] = useState<ResultType>(initialResult ?? 'top');
  const [attempts, setAttempts] = useState(initialAttempts ?? 1);
  const [failureReason, setFailureReason] = useState<FailureReason | null>(initialFailureReason ?? null);
  const [wallAngle, setWallAngle] = useState<string | null>(initialWallAngle ?? null);
  const [holdType, setHoldType] = useState<string | null>(initialHoldType ?? null);
  const [showStyleTags, setShowStyleTags] = useState(Boolean(initialWallAngle || initialHoldType));
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [showNotesInput, setShowNotesInput] = useState(Boolean(initialNotes));
  const [isRendered, setIsRendered] = useState(visible);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(420);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      setGrade(selectedProject?.gradeRaw || selectedProject?.grade_raw || initialGrade || 'V4');
      let defaultResult = initialResult ?? 'top';
      if (disableFlash && defaultResult === 'flash') {
        defaultResult = 'attempt';
      }
      setResult(defaultResult);
      setAttempts(initialAttempts ?? 1);
      setNotes(initialNotes ?? '');
      setShowNotesInput(Boolean(initialNotes && initialNotes.trim().length > 0));
      setFailureReason(initialFailureReason ?? null);
      setWallAngle(selectedProject?.wallAngle || selectedProject?.wall_angle || initialWallAngle || null);
      setHoldType(selectedProject?.holdType || selectedProject?.hold_type || initialHoldType || null);
      setShowStyleTags(Boolean(initialWallAngle || initialHoldType));

      if (reduceMotion) {
        backdropOpacity.value = 1;
        sheetTranslateY.value = 0;
      } else {
        backdropOpacity.value = withTiming(1, {
          duration: motion.duration.fast,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        });
        sheetTranslateY.value = withSpring(0, {
          damping: motion.sheetSpring.damping,
          stiffness: motion.sheetSpring.stiffness,
        });
      }
    } else if (isRendered) {
      if (reduceMotion) {
        setIsRendered(false);
        backdropOpacity.value = 0;
        sheetTranslateY.value = 420;
      } else {
        backdropOpacity.value = withTiming(0, { duration: 180 });
        sheetTranslateY.value = withTiming(420, { duration: 200, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) {
            runOnJS(setIsRendered)(false);
          }
        });
      }
    }
  }, [visible]);

  // Keep grade and style synced if user taps an active project inside the sheet
  useEffect(() => {
    if (selectedProject) {
      const pGrade = selectedProject.gradeRaw || selectedProject.grade_raw;
      if (pGrade) setGrade(pGrade);
      if (selectedProject.wallAngle || selectedProject.wall_angle) {
        setWallAngle(selectedProject.wallAngle || selectedProject.wall_angle);
      }
      if (selectedProject.holdType || selectedProject.hold_type) {
        setHoldType(selectedProject.holdType || selectedProject.hold_type);
      }
      if ((selectedProject.attempts || 0) > 0 && result === 'flash') {
        setResult('top');
      }
    }
  }, [selectedProject]);

  useEffect(() => {
    if (result === 'flash') setAttempts(1);
  }, [result]);

  useEffect(() => {
    if (attempts > 1 && result === 'flash') {
      setResult('top');
    }
  }, [attempts, result]);

  const handleCloseAnimation = () => {
    if (reduceMotion) {
      setIsRendered(false);
      onClose();
      return;
    }
    backdropOpacity.value = withTiming(0, { duration: 180 });
    sheetTranslateY.value = withTiming(
      420,
      { duration: 200, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setIsRendered)(false);
          runOnJS(onClose)();
        }
      }
    );
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) {
        sheetTranslateY.value = e.translationY * 0.18;
      } else {
        sheetTranslateY.value = e.translationY;
        backdropOpacity.value = interpolate(
          e.translationY,
          [0, 320],
          [1, 0.2],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 650) {
        backdropOpacity.value = withTiming(0, { duration: 180 });
        sheetTranslateY.value = withSpring(
          460,
          {
            velocity: e.velocityY,
            damping: 26,
            stiffness: 260,
            overshootClamping: true,
          },
          (finished) => {
            if (finished) {
              runOnJS(setIsRendered)(false);
              runOnJS(onClose)();
            }
          }
        );
      } else {
        backdropOpacity.value = withTiming(1, { duration: 150 });
        sheetTranslateY.value = withSpring(0, {
          velocity: e.velocityY,
          damping: motion.sheetSpring.damping,
          stiffness: motion.sheetSpring.stiffness,
        });
      }
    });

  const handleSave = () => {
    const finalNotes = notes.trim();
    const activeFailure = result === 'attempt' ? failureReason : null;
    onSave(
      grade,
      result,
      result === 'flash' ? 1 : attempts,
      finalNotes,
      activeFailure,
      selectedProject,
      wallAngle,
      holdType
    );
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!visible && !isRendered) return null;

  const isGradeLocked = Boolean(lockGrade || selectedProject);
  const isFlashDisabled = Boolean(
    disableFlash ||
    attempts > 1 ||
    (selectedProject && ((selectedProject.attempts || 0) > 0 || (selectedProject.burns || 0) > 0))
  );

  return (
    <Modal visible={visible || isRendered} transparent onRequestClose={handleCloseAnimation}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          {/* Animated backdrop */}
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseAnimation} />
          </Animated.View>

          <View style={{ width: '100%' }}>
            <Animated.View
              style={[
                {
                  backgroundColor: colors.card,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  paddingHorizontal: space.lg,
                  paddingTop: space.md,
                  paddingBottom: Math.max(insets.bottom, space.md),
                  maxHeight: '92%',
                  ...shadow.floating,
                },
                sheetStyle,
              ]}
            >
              {/* Top Specular Glass Rim */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 24,
                  right: 24,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              />

              {/* Gesture-enabled Drag Handle & Header */}
              <GestureDetector gesture={panGesture}>
                <Animated.View>
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
                      marginBottom: space.md,
                    }}
                  >
                    <Text style={[type.title, { color: colors.text, fontWeight: '700', flex: 1 }]} numberOfLines={1}>
                      {selectedProject
                        ? `Log • ${selectedProject.title}`
                        : title || 'Log Climb'}
                    </Text>
                    <ScalePressable
                      onPress={handleCloseAnimation}
                      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                      minTouchTarget
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <X size={22} color={colors.textMuted} />
                    </ScalePressable>
                  </View>
                </Animated.View>
              </GestureDetector>

              <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ gap: space.lg, paddingBottom: space.md }}
              >
                {/* Optional Active Gym Projects Quick Picker */}
                {projects.length > 0 && onSelectProject && (
                  <View>
                    <SectionHeader title="Project (Optional)" />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ gap: space.xs }}
                    >
                      {projects.map((p: any) => {
                        const isSelected = selectedProject?.id === p.id;
                        const pGrade = formatGradeLabel(p.gradeRaw || p.grade_raw || 'V0');
                        return (
                          <ScalePressable
                            key={p.id}
                            onPress={() => {
                              triggerHaptic('selection');
                              onSelectProject(isSelected ? null : p);
                            }}
                            haptic="light"
                            activeScale={0.95}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingHorizontal: space.md,
                              height: 40,
                              borderRadius: radius.pill,
                              backgroundColor: isSelected ? colors.accentSoft : colors.cardMuted,
                              borderWidth: 1,
                              borderColor: isSelected ? colors.accent : colors.border,
                            }}
                          >
                            <Target size={14} color={isSelected ? colors.accentText : colors.textMuted} />
                            <Text
                              style={[
                                type.control,
                                {
                                  color: isSelected ? colors.accentText : colors.text,
                                  fontWeight: isSelected ? '700' : '500',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {p.title} ({pGrade})
                            </Text>
                          </ScalePressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Result Section */}
                <View>
                  <SectionHeader title="Outcome" />
                  <ResultSelector
                    value={result}
                    onChange={setResult}
                    disableFlash={isFlashDisabled}
                  />
                </View>

                {/* Root Cause Failure tags if Attempt */}
                {result === 'attempt' && (
                  <View>
                    <SectionHeader title="Why did you fall? (Optional)" />
                    <FailureTagSelector
                      selectedReason={failureReason}
                      onSelectReason={setFailureReason}
                    />
                  </View>
                )}

                {/* Grade Section */}
                <View>
                  <SectionHeader title={isGradeLocked ? "Grade (Locked to Project)" : "Grade"} />
                  {isGradeLocked ? (
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

                {/* 1-Tap Wall Angle & Hold Type Tagging (powers WallAngleRadar) */}
                {!selectedProject && (
                  <View>
                    {showStyleTags ? (
                      <View style={{ gap: space.sm }}>
                        <SectionHeader title="Wall Angle & Hold Style (Optional)" />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row', gap: space.xs }}>
                            {WALL_ANGLE_OPTIONS.map((a) => (
                              <Chip
                                key={a.key}
                                label={a.label}
                                active={wallAngle === a.key}
                                onPress={() => {
                                  triggerHaptic('selection');
                                  setWallAngle(wallAngle === a.key ? null : a.key);
                                }}
                              />
                            ))}
                          </View>
                        </ScrollView>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row', gap: space.xs }}>
                            {HOLD_TYPE_OPTIONS.map((h) => (
                              <Chip
                                key={h.key}
                                label={h.label}
                                active={holdType === h.key}
                                onPress={() => {
                                  triggerHaptic('selection');
                                  setHoldType(holdType === h.key ? null : h.key);
                                }}
                              />
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    ) : (
                      <ScalePressable
                        onPress={() => {
                          triggerHaptic('light');
                          setShowStyleTags(true);
                        }}
                        haptic="light"
                        activeScale={0.97}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: space.xs,
                          height: 40,
                          borderRadius: radius.md,
                          backgroundColor: colors.cardMuted,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Layers size={14} color={colors.textMuted} />
                        <Text style={[type.control, { color: colors.textMuted }]}>
                          + Tag wall angle & hold style
                        </Text>
                      </ScalePressable>
                    )}
                  </View>
                )}

                {/* Collapsed / Expandable Notes Input */}
                <View>
                  {showNotesInput ? (
                    <>
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
                            borderRadius: radius.lg,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: space.md,
                            minHeight: 74,
                            textAlignVertical: 'top',
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <ScalePressable
                      onPress={() => {
                        triggerHaptic('light');
                        setShowNotesInput(true);
                      }}
                      haptic="light"
                      activeScale={0.97}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: space.xs,
                        height: 44,
                        borderRadius: radius.md,
                        backgroundColor: colors.cardMuted,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <FileText size={15} color={colors.textMuted} />
                      <Text style={[type.control, { color: colors.textMuted }]}>
                        + Add beta or notes
                      </Text>
                    </ScalePressable>
                  )}
                </View>
              </Animated.ScrollView>

              {/* Save Button */}
              <View style={{ paddingTop: space.md }}>
                <PrimaryButton
                  testID="save-climb-btn"
                  label="SAVE CLIMB"
                  onPress={handleSave}
                />
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
