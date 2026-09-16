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
import { BetaCameraRecorder } from '../media/BetaCameraRecorder';
import { BetaPreviewModal } from './BetaPreviewModal';
import { FailureTagSelector } from './FailureTagSelector';

interface SetRowProps {
  log: BoulderLog;
  index: number;
  groupId: string;
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
    (uri: string, type: 'video' | 'photo', gradeRaw?: string, notes?: string, outcome?: string, failureReason?: string) => {
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
      if (outcome) {
        setOutcome(groupId, log.id, outcome as any);
      }
      if (failureReason) {
        setFailureReason(groupId, log.id, failureReason as any);
      }
    },
    [groupId, log.id, commitSetGrading, updateSetMedia, setOutcome, setFailureReason]
  );

  const handleDeleteBeta = useCallback(() => {
    updateSetMedia(groupId, log.id, null, null);
  }, [groupId, log.id, updateSetMedia]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <View
        className={`flex-row items-center justify-between py-2 px-1 rounded-xl mb-1 ${
          isSent ? 'bg-[#16161C]' : ''
        }`}
        style={{ minHeight: 52 }}
      >
        {/* ── Left: Set Number & Grade Pill ──────────────────────────── */}
        <View className="flex-row items-center gap-2 w-1/3">
          <Text style={{ fontSize: 12, color: '#8A8A98', fontWeight: 'bold' }}>#{index}</Text>
          <TouchableOpacity
            onPress={() => setGradeSheetOpen(true)}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              backgroundColor: '#17171C',
              borderColor: '#2C2C35',
              borderWidth: 1,
            }}
            className="rounded-lg px-2.5 py-1 items-center justify-center"
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
              {log.gradeRaw}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Center: Attempts Stepper ───────────────────────────────── */}
        <View className="flex-row items-center justify-center w-1/3">
          <View
            style={{ backgroundColor: '#17171C', borderColor: '#2C2C35', borderWidth: 1 }}
            className="flex-row items-center rounded-xl overflow-hidden"
          >
            <TouchableOpacity
              onPress={handleDecrement}
              activeOpacity={0.7}
              style={{ width: 36, height: 36 }}
              className="items-center justify-center"
            >
              <Minus size={14} color="#FFFFFF" />
            </TouchableOpacity>
            <Text
              style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}
              className="px-2 text-center"
            >
              {log.attempts} att
            </Text>
            <TouchableOpacity
              onPress={handleIncrement}
              activeOpacity={0.7}
              style={{ width: 36, height: 36 }}
              className="items-center justify-center"
            >
              <Plus size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Right Action Group ─────────────────────────────────────── */}
        <View className="flex-row items-center justify-end gap-2 w-1/3">
          {/* Video/Camera Trigger */}
          {log.media_uri ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setPreviewModalOpen(true);
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#8E7CFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#A294FF',
              }}
            >
              {log.media_type === 'photo' ? (
                <Camera size={16} color="#FFFFFF" />
              ) : (
                <Play size={15} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setCamModalOpen(true);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2C2C35',
                backgroundColor: '#1E1E24',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={16} color="#8A8A98" />
            </TouchableOpacity>
          )}

          {/* Send Checkmark / Flash Button */}
          <Pressable
            onPressIn={() => {
              sendScale.value = withSpring(0.93, { damping: 14, stiffness: 240 });
            }}
            onPressOut={() => {
              sendScale.value = withSpring(1.0, { damping: 14, stiffness: 240 });
            }}
            onPress={handleSendTap}
            onLongPress={isSent ? handleFlashLongPress : undefined}
            delayLongPress={400}
          >
            <Animated.View
              style={[
                {
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isFlash ? '#6EE756' : isSent ? '#8E7CFF' : '#17171C',
                  borderColor: isFlash ? '#6EE756' : isSent ? '#8E7CFF' : '#2C2C35',
                  borderWidth: 1,
                },
                sendAnimatedStyle,
              ]}
            >
              {isFlash ? (
                <Zap size={20} color="#111115" fill="#111115" />
              ) : isSent ? (
                <Check size={20} color="#FFFFFF" strokeWidth={3} />
              ) : null}
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

      <BetaCameraRecorder
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
