import React, { useState } from 'react';
import { View, Text, TouchableOpacity, } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Target, Zap, Check, AlertTriangle, Layers } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import type { WallAngle, HoldType, Outcome, FailureReason } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { FailureReasonPrompt } from './FailureReasonPrompt';

const GRADES = ['V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11'];
const ANGLES: { key: WallAngle; label: string }[] = [
  { key: 'slab', label: 'SLAB' },
  { key: 'vertical', label: 'VERT' },
  { key: 'overhang', label: 'OVERHANG' },
  { key: 'roof', label: 'ROOF' },
];
const HOLDS: { key: HoldType; label: string }[] = [
  { key: 'crimps', label: 'CRIMPS' },
  { key: 'slopers', label: 'SLOPERS' },
  { key: 'pinches', label: 'PINCHES' },
  { key: 'pockets', label: 'POCKETS' },
  { key: 'volumes', label: 'VOLUMES' },
];

export function ChalkSafeLogger() {
  const activeProject = useSessionStore((s) => s.activeProjectTarget);
  const logGenericAscent = useSessionStore((s) => s.logGenericAscent);
  const setAttemptFailureReason = useSessionStore((s) => s.setAttemptFailureReason);
  const pendingAttemptId = useSessionStore((s) => s.pendingAttemptId);

  // Parameter State (defaults to active project if selected)
  const [selectedGrade, setSelectedGrade] = useState<string>(activeProject?.gradeRaw ?? 'V5');
  const [selectedAngle, setSelectedAngle] = useState<WallAngle>(activeProject?.wallAngle ?? 'overhang');
  const [selectedHold, setSelectedHold] = useState<HoldType>(activeProject?.holdType ?? 'crimps');
  const [isProjectMode, setIsProjectMode] = useState<boolean>(Boolean(activeProject));

  const handleLog = (outcome: Outcome) => {
    triggerHaptic(outcome === 'flash' ? 'heavy' : outcome === 'send' ? 'medium' : 'light');

    logGenericAscent({
      gradeRaw: isProjectMode && activeProject ? activeProject.gradeRaw : selectedGrade,
      wallAngle: isProjectMode && activeProject ? activeProject.wallAngle : selectedAngle,
      holdType: isProjectMode && activeProject ? activeProject.holdType : selectedHold,
      outcome,
      projectId: isProjectMode && activeProject ? activeProject.id : null,
    });
  };

  const handleSelectFailureReason = (reason: FailureReason | null) => {
    if (pendingAttemptId) {
      setAttemptFailureReason(pendingAttemptId, reason);
    }
  };

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-2xl p-4 mb-4">
      {/* ── Mode Toggle: Generic Volume vs Active Project ─────────────── */}
      <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-[#22222A]">
        <View className="flex-row items-center gap-2">
          <Layers size={14} color="#8E7CFF" />
          <Text className="text-white text-xs font-bold uppercase tracking-wider">
            {isProjectMode && activeProject ? `SIEGE: ${activeProject.title}` : 'GENERIC ASCENT'}
          </Text>
        </View>

        {activeProject && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setIsProjectMode(!isProjectMode);
            }}
            className="bg-[#141417] border border-[#22222A] px-2.5 py-1 rounded-md"
          >
            <Text className="text-[#8E7CFF] text-[10px] font-bold uppercase">
              {isProjectMode ? 'Switch to Volume' : 'Switch to Project'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Parameter Selectors (Only shown in Generic Mode) ─────────── */}
      {!isProjectMode && (
        <View className="gap-2.5 mb-4">
          {/* Grade Selector */}
          <Reanimated.ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-1.5">
              {GRADES.map((g) => {
                const isSelected = selectedGrade === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedGrade(g);
                    }}
                    className={`px-3 py-1.5 rounded-lg border ${
                      isSelected
                        ? 'bg-[#8E7CFF] border-[#8E7CFF]'
                        : 'bg-[#141417] border-[#22222A]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-[#9090A0]'
                      }`}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Reanimated.ScrollView>

          {/* Angle Selector */}
          <View className="flex-row gap-1.5">
            {ANGLES.map((angle) => {
              const isSelected = selectedAngle === angle.key;
              return (
                <TouchableOpacity
                  key={angle.key}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedAngle(angle.key);
                  }}
                  className={`flex-1 py-1.5 rounded-lg border items-center ${
                    isSelected
                      ? 'bg-[#8E7CFF]/20 border-[#8E7CFF]'
                      : 'bg-[#141417] border-[#22222A]'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      isSelected ? 'text-[#8E7CFF]' : 'text-[#555562]'
                    }`}
                  >
                    {angle.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hold Type Selector */}
          <View className="flex-row gap-1.5">
            {HOLDS.map((hold) => {
              const isSelected = selectedHold === hold.key;
              return (
                <TouchableOpacity
                  key={hold.key}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedHold(hold.key);
                  }}
                  className={`flex-1 py-1.5 rounded-lg border items-center ${
                    isSelected
                      ? 'bg-[#8E7CFF]/20 border-[#8E7CFF]'
                      : 'bg-[#141417] border-[#22222A]'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold ${
                      isSelected ? 'text-[#8E7CFF]' : 'text-[#555562]'
                    }`}
                  >
                    {hold.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Big Touch Chalk-Safe Action Grid ─────────────────────────── */}
      <View className="flex-row gap-2.5">
        {/* FALL */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleLog('fall')}
          className="flex-1 h-14 bg-[#141417] border border-[#FF453A]/40 rounded-xl items-center justify-center flex-row gap-1.5"
        >
          <AlertTriangle size={16} color="#FF453A" />
          <Text className="text-[#FF453A] font-bold text-sm uppercase tracking-wider">
            FALL
          </Text>
        </TouchableOpacity>

        {/* SEND */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleLog('send')}
          className="flex-1 h-14 bg-[#141417] border border-[#8E7CFF] rounded-xl items-center justify-center flex-row gap-1.5"
        >
          <Check size={18} color="#8E7CFF" strokeWidth={2.5} />
          <Text className="text-[#8E7CFF] font-bold text-sm uppercase tracking-wider">
            SEND
          </Text>
        </TouchableOpacity>

        {/* FLASH */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleLog('flash')}
          className="flex-1 h-14 bg-[#141417] border border-[#6EE756] rounded-xl items-center justify-center flex-row gap-1.5"
        >
          <Zap size={16} color="#6EE756" fill="#6EE756" />
          <Text className="text-[#6EE756] font-bold text-sm uppercase tracking-wider">
            FLASH
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Failure Reason Bottom Sheet ──────────────────────────────── */}
      <FailureReasonPrompt
        visible={Boolean(pendingAttemptId)}
        onSelect={handleSelectFailureReason}
        onDismiss={() => {
          if (pendingAttemptId) setAttemptFailureReason(pendingAttemptId, null);
        }}
      />
    </View>
  );
}
