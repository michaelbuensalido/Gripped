import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Minus, Plus, Check, Zap, Camera, Play } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/haptics';
import type { BoulderLog } from '../../types';
import { GRADE_BY_LABEL } from '../../constants/grades';
import { useSessionStore } from '../../store/sessionStore';
import { GradeSheet } from './GradeSheet';
import { BetaCamModal } from './BetaCamModal';
import { BetaPreviewModal } from './BetaPreviewModal';
import { FailureTagSelector } from './FailureTagSelector';

interface SetRowProps {
  log: BoulderLog;
  index: number;
  groupId: string;
}

const RPE_MIN = 1;
const RPE_MAX = 10;

/** Color that shifts green → yellow → red as RPE increases */
function rpeColor(rpe: number): string {
  if (rpe <= 4) return '#22C55E';
  if (rpe <= 7) return '#EAB308';
  return '#EF4444';
}

export function SetRow({ log, index, groupId }: SetRowProps) {
  const [gradeSheetOpen, setGradeSheetOpen] = useState(false);
  const [camModalOpen, setCamModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const setOutcome      = useSessionStore((s) => s.setOutcome);
  const updateGrade     = useSessionStore((s) => s.updateGrade);
  const updateRpe       = useSessionStore((s) => s.updateRpe);
  const incrementAttempts = useSessionStore((s) => s.incrementAttempts);
  const decrementAttempts = useSessionStore((s) => s.decrementAttempts);
  const updateSetMedia  = useSessionStore((s) => s.updateSetMedia);
  const commitSetGrading = useSessionStore((s) => s.commitSetGrading);
  const triggerRestTimer  = useSessionStore((s) => s.triggerRestTimer);
  const setFailureReason  = useSessionStore((s) => s.setFailureReason);

  const grade   = GRADE_BY_LABEL[log.gradeRaw];
  const isSent  = log.outcome === 'send' || log.outcome === 'flash';
  const isFlash = log.outcome === 'flash';

  // ── Spring Scale Feedback ──────────────────────────────────────────────────
  const sendScale = useSharedValue(1);
  const flashScale = useSharedValue(1);

  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const flashAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashScale.value }],
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGradeSelect = useCallback(
    (gradeRaw: string) => updateGrade(groupId, log.id, gradeRaw),
    [groupId, log.id, updateGrade]
  );

  const handleIncrement = useCallback(() => {
    triggerHaptic('light');
    incrementAttempts(groupId, log.id);
  }, [groupId, log.id, incrementAttempts]);

  const handleDecrement = useCallback(() => {
    triggerHaptic('light');
    decrementAttempts(groupId, log.id);
  }, [groupId, log.id, decrementAttempts]);

  const handleRpeIncrement = useCallback(() => {
    triggerHaptic('light');
    const next = Math.min((log.rpe ?? 0) + 1, RPE_MAX);
    updateRpe(groupId, log.id, next);
  }, [groupId, log.id, log.rpe, updateRpe]);

  const handleRpeDecrement = useCallback(() => {
    triggerHaptic('light');
    const current = log.rpe ?? 0;
    updateRpe(groupId, log.id, current <= 1 ? null : current - 1);
  }, [groupId, log.id, log.rpe, updateRpe]);

  /** Single tap: toggle attempt ↔ send. Distinct haptics for Attempt (light) and Top (medium). Auto-triggers rest timer. */
  const handleSendTap = useCallback(() => {
    const next = isSent ? 'attempt' : 'send';
    if (next === 'attempt') {
      triggerHaptic('light');
    } else {
      triggerHaptic('medium');
    }
    setOutcome(groupId, log.id, next);
    const group = useSessionStore.getState().groups.find((g) => g.id === groupId);
    triggerRestTimer(group?.defaultRestSeconds ?? 180);
  }, [isSent, groupId, log.id, setOutcome, triggerRestTimer]);

  /** Flash toggle: heavy success notification haptic. Auto-triggers rest timer. */
  const handleFlashLongPress = useCallback(() => {
    const next = isFlash ? 'send' : 'flash';
    if (next === 'flash') {
      triggerHaptic('success');
    } else {
      triggerHaptic('medium');
    }
    setOutcome(groupId, log.id, next);
    const group = useSessionStore.getState().groups.find((g) => g.id === groupId);
    triggerRestTimer(group?.defaultRestSeconds ?? 180);
  }, [isFlash, groupId, log.id, setOutcome, triggerRestTimer]);

  const handleAttachBeta = useCallback(
    (uri: string, type: 'video' | 'photo', gradeRaw?: string, notes?: string) => {
      if (gradeRaw) {
        commitSetGrading(groupId, log.id, {
          gradeRaw,
          mediaUri: uri,
          mediaType: type,
          notes,
        });
      } else {
        updateSetMedia(groupId, log.id, uri, type);
      }
    },
    [groupId, log.id, commitSetGrading, updateSetMedia]
  );

  const handleDeleteBeta = useCallback(() => {
    updateSetMedia(groupId, log.id, null, null);
  }, [groupId, log.id, updateSetMedia]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <View
        className={`flex-row items-center py-2.5 px-1 gap-2 rounded-xl ${
          isSent ? 'bg-[#16161C]' : ''
        }`}
      >
        {/* ── #Index ─────────────────────────────────────────────────── */}
        <Text className="text-muted text-xs font-bold w-5 text-center">{index}</Text>

        {/* ── Grade Pill ─────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => setGradeSheetOpen(true)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ backgroundColor: grade?.color ?? '#2C2C35' }}
          className="rounded-full px-3 py-1.5 min-w-[46px] items-center justify-center"
        >
          <Text style={{ color: grade?.textColor ?? '#fff' }} className="text-sm font-black">
            {log.gradeRaw}
          </Text>
        </TouchableOpacity>

        {/* ── RPE Stepper ────────────────────────────────────────────── */}
        <View className="flex-col items-center">
          <Text className="text-muted text-[9px] font-semibold uppercase tracking-wide mb-0.5">
            RPE
          </Text>
          <View
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
            className="flex-row items-center rounded-lg border overflow-hidden"
          >
            <TouchableOpacity
              onPress={handleRpeDecrement}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-7 h-8 items-center justify-center"
            >
              <Minus size={11} color="#8A8A98" />
            </TouchableOpacity>
            <Text
              style={{ color: log.rpe ? rpeColor(log.rpe) : '#484852' }}
              className="text-sm font-black w-6 text-center"
            >
              {log.rpe ?? '—'}
            </Text>
            <TouchableOpacity
              onPress={handleRpeIncrement}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-7 h-8 items-center justify-center"
            >
              <Plus size={11} color="#8A8A98" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Attempts Stepper ───────────────────────────────────────── */}
        <View className="flex-col items-center">
          <Text className="text-muted text-[9px] font-semibold uppercase tracking-wide mb-0.5">
            Att
          </Text>
          <View
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
            className="flex-row items-center rounded-lg border overflow-hidden"
          >
            <TouchableOpacity
              onPress={handleDecrement}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-7 h-8 items-center justify-center"
            >
              <Minus size={11} color="#8A8A98" />
            </TouchableOpacity>
            <Text className="text-white font-black text-sm w-6 text-center">
              {log.attempts}
            </Text>
            <TouchableOpacity
              onPress={handleIncrement}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-7 h-8 items-center justify-center"
            >
              <Plus size={11} color="#8A8A98" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Beta Cam + Flash + Send Checkbox ────────────────────────── */}
        <View className="flex-1 flex-row items-center justify-end gap-1.5">
          {/* Beta Cam Trigger */}
          {log.media_uri ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setPreviewModalOpen(true);
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#8E7CFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#A294FF',
                shadowColor: '#8E7CFF',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 5,
              }}
            >
              {log.media_type === 'photo' ? (
                <Camera size={15} color="#FFFFFF" />
              ) : (
                <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setCamModalOpen(true);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#2C2C35',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={16} color="#8A8A98" />
            </TouchableOpacity>
          )}

          {/* Flash lightning — only visible/tappable once sent */}
          {isSent && (
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPressIn={() => {
                flashScale.value = withSpring(0.93, { damping: 14, stiffness: 240 });
              }}
              onPressOut={() => {
                flashScale.value = withSpring(1.0, { damping: 14, stiffness: 240 });
              }}
              onPress={handleFlashLongPress}
            >
              <Animated.View
                style={[
                  {
                    backgroundColor: isFlash ? '#6EE756' : 'rgba(255, 255, 255, 0.06)',
                    borderColor: isFlash ? '#6EE756' : 'rgba(255, 255, 255, 0.10)',
                  },
                  flashAnimatedStyle,
                ]}
                className="w-9 h-9 rounded-xl items-center justify-center border"
              >
                <Zap
                  size={16}
                  color={isFlash ? '#FFFFFF' : '#8A8A98'}
                  fill={isFlash ? '#FFFFFF' : 'none'}
                />
              </Animated.View>
            </Pressable>
          )}

          {/* Send checkbox with spring scale */}
          <Pressable
            onPressIn={() => {
              sendScale.value = withSpring(0.93, { damping: 14, stiffness: 240 });
            }}
            onPressOut={() => {
              sendScale.value = withSpring(1.0, { damping: 14, stiffness: 240 });
            }}
            onPress={handleSendTap}
          >
            <Animated.View
              style={[
                {
                  backgroundColor: isSent ? (isFlash ? '#6EE756' : '#8E7CFF') : 'transparent',
                  borderColor: isSent ? (isFlash ? '#6EE756' : '#8E7CFF') : '#2C2C35',
                },
                sendAnimatedStyle,
              ]}
              className="w-11 h-11 rounded-xl items-center justify-center border-2"
            >
              {isSent && <Check size={20} color="#FFFFFF" strokeWidth={3} />}
            </Animated.View>
          </Pressable>
        </View>
      </View>

      {/* Failure Reason Tag Chips: smoothly expanded when marked as 'attempt' */}
      {log.outcome === 'attempt' && (
        <FailureTagSelector
          selectedReason={log.failureReason ?? log.failure_reason ?? null}
          onSelectReason={(reason) => setFailureReason(groupId, log.id, reason)}
        />
      )}

      <GradeSheet
        visible={gradeSheetOpen}
        selectedGrade={log.gradeRaw}
        onSelect={handleGradeSelect}
        onClose={() => setGradeSheetOpen(false)}
      />

      <BetaCamModal
        visible={camModalOpen}
        onClose={() => setCamModalOpen(false)}
        onAttach={handleAttachBeta}
        gradeLabel={log.gradeRaw}
        setIndex={index}
      />

      <BetaPreviewModal
        visible={previewModalOpen}
        mediaUri={log.media_uri ?? null}
        mediaType={log.media_type}
        setIndex={index}
        gradeRaw={log.gradeRaw}
        outcome={log.outcome}
        onClose={() => setPreviewModalOpen(false)}
        onRetake={() => setCamModalOpen(true)}
        onDelete={handleDeleteBeta}
      />
    </>
  );
}
