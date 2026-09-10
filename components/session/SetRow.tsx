import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus, Check, Zap } from 'lucide-react-native';
import type { BoulderLog } from '../../types';
import { GRADE_BY_LABEL } from '../../constants/grades';
import { useSessionStore } from '../../store/sessionStore';
import { GradeSheet } from './GradeSheet';

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

  const setOutcome      = useSessionStore((s) => s.setOutcome);
  const updateGrade     = useSessionStore((s) => s.updateGrade);
  const updateRpe       = useSessionStore((s) => s.updateRpe);
  const incrementAttempts = useSessionStore((s) => s.incrementAttempts);
  const decrementAttempts = useSessionStore((s) => s.decrementAttempts);
  const triggerRestTimer  = useSessionStore((s) => s.triggerRestTimer);

  const grade   = GRADE_BY_LABEL[log.gradeRaw];
  const isSent  = log.outcome === 'send' || log.outcome === 'flash';
  const isFlash = log.outcome === 'flash';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGradeSelect = useCallback(
    (gradeRaw: string) => updateGrade(groupId, log.id, gradeRaw),
    [groupId, log.id, updateGrade]
  );

  const handleIncrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementAttempts(groupId, log.id);
  }, [groupId, log.id, incrementAttempts]);

  const handleDecrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    decrementAttempts(groupId, log.id);
  }, [groupId, log.id, decrementAttempts]);

  const handleRpeIncrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.min((log.rpe ?? 0) + 1, RPE_MAX);
    updateRpe(groupId, log.id, next);
  }, [groupId, log.id, log.rpe, updateRpe]);

  const handleRpeDecrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = log.rpe ?? 0;
    updateRpe(groupId, log.id, current <= 1 ? null : current - 1);
  }, [groupId, log.id, log.rpe, updateRpe]);

  /** Single tap: toggle attempt ↔ send. Long press: mark flash */
  const handleSendTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = isSent ? 'attempt' : 'send';
    setOutcome(groupId, log.id, next);
    if (next !== 'attempt') triggerRestTimer();
  }, [isSent, groupId, log.id, setOutcome, triggerRestTimer]);

  const handleFlashLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const next = isFlash ? 'send' : 'flash';
    setOutcome(groupId, log.id, next);
    triggerRestTimer();
  }, [isFlash, groupId, log.id, setOutcome, triggerRestTimer]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <View
        className={`flex-row items-center py-2.5 px-1 gap-2 rounded-xl ${
          isSent ? 'bg-surface/60' : ''
        }`}
      >
        {/* ── #Index ─────────────────────────────────────────────────── */}
        <Text className="text-muted text-xs font-bold w-5 text-center">{index}</Text>

        {/* ── Grade Pill ─────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => setGradeSheetOpen(true)}
          activeOpacity={0.8}
          style={{ backgroundColor: grade?.color ?? '#374151' }}
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
          <View className="flex-row items-center bg-card rounded-lg border border-border overflow-hidden">
            <TouchableOpacity
              onPress={handleRpeDecrement}
              activeOpacity={0.7}
              className="w-7 h-8 items-center justify-center"
            >
              <Minus size={11} color="#6B7280" />
            </TouchableOpacity>
            <Text
              style={{ color: log.rpe ? rpeColor(log.rpe) : '#4B5563' }}
              className="text-sm font-black w-6 text-center"
            >
              {log.rpe ?? '—'}
            </Text>
            <TouchableOpacity
              onPress={handleRpeIncrement}
              activeOpacity={0.7}
              className="w-7 h-8 items-center justify-center"
            >
              <Plus size={11} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Attempts Stepper ───────────────────────────────────────── */}
        <View className="flex-col items-center">
          <Text className="text-muted text-[9px] font-semibold uppercase tracking-wide mb-0.5">
            Att
          </Text>
          <View className="flex-row items-center bg-card rounded-lg border border-border overflow-hidden">
            <TouchableOpacity
              onPress={handleDecrement}
              activeOpacity={0.7}
              className="w-7 h-8 items-center justify-center"
            >
              <Minus size={11} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-white font-black text-sm w-6 text-center">
              {log.attempts}
            </Text>
            <TouchableOpacity
              onPress={handleIncrement}
              activeOpacity={0.7}
              className="w-7 h-8 items-center justify-center"
            >
              <Plus size={11} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Send Checkbox + Flash indicator ────────────────────────── */}
        <View className="flex-1 flex-row items-center justify-end gap-2">
          {/* Flash lightning — only visible/tappable once sent */}
          {isSent && (
            <TouchableOpacity
              onPress={handleFlashLongPress}
              activeOpacity={0.7}
              className={`w-9 h-9 rounded-xl items-center justify-center border ${
                isFlash ? 'bg-flash border-flash' : 'bg-card border-border'
              }`}
            >
              <Zap
                size={16}
                color={isFlash ? '#FFFFFF' : '#4B5563'}
                fill={isFlash ? '#FFFFFF' : 'none'}
              />
            </TouchableOpacity>
          )}

          {/* Send checkbox */}
          <Pressable
            onPress={handleSendTap}
            className={`w-11 h-11 rounded-xl items-center justify-center border-2 ${
              isSent
                ? isFlash
                  ? 'bg-flash border-flash'
                  : 'bg-send border-send'
                : 'bg-transparent border-border'
            }`}
          >
            {isSent && <Check size={20} color="#FFFFFF" strokeWidth={3} />}
          </Pressable>
        </View>
      </View>

      <GradeSheet
        visible={gradeSheetOpen}
        selectedGrade={log.gradeRaw}
        onSelect={handleGradeSelect}
        onClose={() => setGradeSheetOpen(false)}
      />
    </>
  );
}
