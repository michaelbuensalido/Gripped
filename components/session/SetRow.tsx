import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable, Platform, ScrollView } from 'react-native';
import { Camera, Play, Check, Zap } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/haptics';
import { hapticEngine } from '../../services/hapticEngine';
import type { BoulderLog } from '../../types';
import { useSessionStore } from '../../store/sessionStore';
import { GradeSheet } from './GradeSheet';
import { BetaCameraRecorder } from '../media/BetaCameraRecorder';
import { BetaPreviewModal } from './BetaPreviewModal';

interface SetRowProps {
  log: BoulderLog;
  index: number;
  groupId: string;
}

const FAILURE_REASONS = ['Foot Slip', 'Pumped', 'Beta Error', 'Span', 'Grip'];

export function SetRow({ log, index, groupId }: SetRowProps) {
  const [gradeSheetOpen, setGradeSheetOpen] = useState(false);
  const [camModalOpen, setCamModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const setOutcome       = useSessionStore((s) => s.setOutcome);
  const updateGrade      = useSessionStore((s) => s.updateGrade);
  const incrementAttempts = useSessionStore((s) => s.incrementAttempts);
  const decrementAttempts = useSessionStore((s) => s.decrementAttempts);
  const updateSetMedia   = useSessionStore((s) => s.updateSetMedia);
  const commitSetGrading = useSessionStore((s) => s.commitSetGrading);
  const triggerRestTimer = useSessionStore((s) => s.triggerRestTimer);
  const setFailureReason = useSessionStore((s) => s.setFailureReason);

  const isSent  = log.outcome === 'send' || log.outcome === 'flash';
  const isFlash = log.outcome === 'flash';

  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleGradeSelect = useCallback(
    (gradeRaw: string) => updateGrade(groupId, log.id, gradeRaw),
    [groupId, log.id, updateGrade]
  );

  const updateWallAngle = useSessionStore((s) => s.updateWallAngle);

  const handleAngleSelect = useCallback(() => {
    triggerHaptic('light');
    hapticEngine.triggerLightTap();
    const cycle = [null, 'SLAB', 'VERT', 'OVERHANG', 'CAVE'] as const;
    const nextIdx = (cycle.indexOf(log.wallAngle ?? null) + 1) % cycle.length;
    updateWallAngle(groupId, log.id, cycle[nextIdx]);
  }, [groupId, log.id, log.wallAngle, updateWallAngle]);

  const handleIncrement = useCallback(() => {
    hapticEngine.triggerLightTap();
    incrementAttempts(groupId, log.id);
  }, [groupId, log.id, incrementAttempts]);

  const handleDecrement = useCallback(() => {
    hapticEngine.triggerLightTap();
    decrementAttempts(groupId, log.id);
  }, [groupId, log.id, decrementAttempts]);

  const handleSendTap = useCallback(() => {
    if (isSent) {
      hapticEngine.triggerLightTap();
      setOutcome(groupId, log.id, 'attempt');
    } else {
      const outcome = log.attempts === 1 ? 'flash' : 'send';
      hapticEngine.triggerLogAction();
      setOutcome(groupId, log.id, outcome);
      const group = useSessionStore.getState().groups.find((g) => g.id === groupId);
      triggerRestTimer(group?.defaultRestSeconds ?? 180);
    }
  }, [isSent, groupId, log.id, log.attempts, setOutcome, triggerRestTimer]);

  const handleFlashLongPress = useCallback(() => {
    if (!isSent) return;
    const next = isFlash ? 'send' : 'flash';
    hapticEngine.triggerLogAction();
    setOutcome(groupId, log.id, next);
    const group = useSessionStore.getState().groups.find((g) => g.id === groupId);
    triggerRestTimer(group?.defaultRestSeconds ?? 180);
  }, [isSent, isFlash, groupId, log.id, setOutcome, triggerRestTimer]);

  const handleAttachBeta = useCallback(
    (uri: string, type: 'video' | 'photo', gradeRaw?: string, notes?: string, outcome?: string, failureReason?: string) => {
      if (gradeRaw) {
        commitSetGrading(groupId, log.id, { gradeRaw, mediaUri: uri, mediaType: type, notes });
      } else {
        updateSetMedia(groupId, log.id, uri, type);
      }
      if (outcome) setOutcome(groupId, log.id, outcome as any);
      if (failureReason) setFailureReason(groupId, log.id, failureReason as any);
    },
    [groupId, log.id, commitSetGrading, updateSetMedia, setOutcome, setFailureReason]
  );

  const handleDeleteBeta = useCallback(() => {
    updateSetMedia(groupId, log.id, null, null);
  }, [groupId, log.id, updateSetMedia]);

  return (
    <>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setIsExpanded(!isExpanded)}
        className={`h-[52px] flex-row items-center justify-between border-b border-[#22222A] px-2 rounded-lg ${
          (isFlash || isSent) ? 'bg-[rgba(142,124,255,0.08)]' : ''
        }`}
      >
        {/* Set Index */}
        <Text 
          className="w-[10%] text-[#555562] text-[11px]" 
          style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
        >
          #{index}
        </Text>

        {/* Grade Badge */}
        <View className="flex-row items-center gap-2 w-[35%]">
          <TouchableOpacity
            onPress={() => setGradeSheetOpen(true)}
            activeOpacity={0.8}
            className="bg-[#141417] border border-[#2C2C35] px-2.5 py-1.5 rounded-lg"
          >
            <Text className="text-white text-[14px] font-bold">{log.gradeRaw}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAngleSelect}
            activeOpacity={0.8}
            className={`px-2 py-1.5 rounded-lg border ${
              log.wallAngle ? 'border-[#8E7CFF] bg-[#141417]' : 'border-[#27272F] bg-[#141417]'
            }`}
          >
            <Text 
              className={`text-[10px] font-bold tracking-[1px] uppercase ${
                log.wallAngle ? 'text-[#8E7CFF]' : 'text-[#8A8A98]'
              }`}
            >
              {log.wallAngle === 'OVERHANG' ? 'OVHG' : log.wallAngle || '—'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Burns Stepper */}
        <View className="w-[25%] items-center">
          <View className="flex-row items-center bg-[#141417] border border-[#27272F] rounded-lg">
            <TouchableOpacity onPress={handleDecrement} className="w-[30px] h-[36px] items-center justify-center">
              <Text className="text-[#8A8A98] text-[14px]">−</Text>
            </TouchableOpacity>
            <Text className="text-white text-[13px] font-semibold px-1">{log.attempts} att</Text>
            <TouchableOpacity onPress={handleIncrement} className="w-[30px] h-[36px] items-center justify-center">
              <Text className="text-[#8A8A98] text-[14px]">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions Row */}
        <View className="w-[25%] flex-row items-center justify-end gap-2">
          {log.media_uri ? (
            <TouchableOpacity
              onPress={() => { hapticEngine.triggerLightTap(); setPreviewModalOpen(true); }}
              className="w-[40px] h-[40px] bg-[#8E7CFF] rounded-lg items-center justify-center border border-[#8E7CFF]"
            >
              {log.media_type === 'photo' ? (
                <Camera size={16} color="#FFFFFF" />
              ) : (
                <Play size={15} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => { hapticEngine.triggerLightTap(); setCamModalOpen(true); }}
              className="w-[40px] h-[40px] bg-[#141417] rounded-lg items-center justify-center border border-[#27272F]"
            >
              <Camera size={16} color="#8A8A98" />
            </TouchableOpacity>
          )}

          <Pressable
            onPressIn={() => { sendScale.value = withSpring(0.92, { damping: 14, stiffness: 260 }); }}
            onPressOut={() => { sendScale.value = withSpring(1.0, { damping: 14, stiffness: 260 }); }}
            onPress={handleSendTap}
            onLongPress={isSent ? handleFlashLongPress : undefined}
            delayLongPress={400}
          >
            <Animated.View
              className="w-[40px] h-[40px] rounded-lg items-center justify-center"
              style={[sendAnimStyle, {
                backgroundColor: (isFlash || isSent)
                  ? 'rgba(142, 124, 255, 0.20)' 
                  : '#141417',
                borderColor: (isFlash || isSent) ? '#8E7CFF' : '#2C2C35',
                borderWidth: 1,
              }]}
            >
              {isFlash ? <Zap size={18} color="#8E7CFF" fill="#8E7CFF" /> :
               isSent ? <Check size={18} color="#8E7CFF" strokeWidth={3} /> : null}
            </Animated.View>
          </Pressable>
        </View>
      </TouchableOpacity>

      {/* Conditional Failure Chips */}
      {log.attempts > 0 && !isSent && isExpanded && (
        <View className="bg-[#141417] border border-[#22222A] rounded-lg p-2 mt-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {FAILURE_REASONS.map(reason => {
              const isActive = (log.failureReason ?? log.failure_reason) === reason.toLowerCase().replace(' ', '_');
              return (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setFailureReason(groupId, log.id, reason.toLowerCase().replace(' ', '_') as any)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    isActive ? 'border-[#8E7CFF]' : 'bg-[#19191D] border-[#27272F]'
                  }`}
                >
                  <Text className={`text-[11px] ${isActive ? 'text-[#8E7CFF] font-bold' : 'text-[#8A8A98]'}`}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
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
