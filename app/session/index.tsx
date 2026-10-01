import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Flame,
  Zap,
  Check,
  Layers,
  Compass,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useSessionStore } from '../../store/sessionStore';
import { GradeSheet } from '../../components/session/GradeSheet';
import { FloatingRestTimer } from '../../components/session/FloatingRestTimer';
import { SessionCompletionModal } from '../../components/session/SessionCompletionModal';
import { GRADE_BY_LABEL } from '../../constants/grades';
import type { BoulderLog } from '../../types';

// ─── Volume Key Binding ────────────────────────────────────────────────────────
let VolumeManager: any = null;
try {
  VolumeManager = require('react-native-volume-manager').VolumeManager;
} catch (_) {}

export default function LiveSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activeSession = useSessionStore((s) => s.activeSession);
  const startSession = useSessionStore((s) => s.startSession);
  const completeSession = useSessionStore((s) => s.completeSession);
  const groups = useSessionStore((s) => s.groups);
  const ascents = useSessionStore((s) => s.ascents);
  const logWidgetAscent = useSessionStore((s) => s.logWidgetAscent);
  const addGroup = useSessionStore((s) => s.addGroup);
  const addLog = useSessionStore((s) => s.addLog);
  const updateGrade = useSessionStore((s) => s.updateGrade);
  const updateWallAngle = useSessionStore((s) => s.updateWallAngle);

  const [gradeSheetVisible, setGradeSheetVisible] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Auto-init session if accessed directly
  useEffect(() => {
    if (!activeSession) {
      startSession('CRUX GYM');
    }
  }, [activeSession, startSession]);

  // Live 1-second interval timer for TIME metric
  const [, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Tactical Scoreboard Metrics ─────────────────────────────────────────────
  const sends = ascents.filter((a) => a.status === 'SEND').length;
  const flashes = ascents.filter((a) => a.status === 'FLASH').length;
  const burns = ascents.filter((a) => a.status === 'ATTEMPT').length;

  const groupSends = groups.reduce(
    (acc, g) => acc + g.logs.filter((l) => l.outcome === 'send').length,
    0
  );
  const groupFlashes = groups.reduce(
    (acc, g) => acc + g.logs.filter((l) => l.outcome === 'flash').length,
    0
  );
  const groupBurns = groups.reduce(
    (acc, g) => acc + g.logs.reduce((sum, l) => sum + (l.attempts || 1), 0),
    0
  );

  const displaySends = Math.max(sends + flashes, groupSends + groupFlashes);
  const displayBurns = Math.max(burns, groupBurns);
  const totalAttempts = displaySends + displayBurns;
  const gravity = totalAttempts > 0 ? (displaySends / totalAttempts) * 100 : 0;

  const elapsed = activeSession
    ? Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000))
    : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  // ─── Active Group & Current Boulder ──────────────────────────────────────────
  const activeGroup = useMemo(() => {
    const uncompleted = groups.filter((g) => !g.isCompleted);
    return uncompleted.length > 0 ? uncompleted[0] : groups[0] ?? null;
  }, [groups]);

  const currentLog = useMemo(() => {
    if (!activeGroup || !activeGroup.logs || activeGroup.logs.length === 0) return null;
    const inProgress = activeGroup.logs.find(
      (l) => l.outcome !== 'send' && l.outcome !== 'flash'
    );
    return inProgress ?? activeGroup.logs[activeGroup.logs.length - 1];
  }, [activeGroup]);

  // ─── Touch Action Handlers ───────────────────────────────────────────────────
  const handleAttempt = useCallback(() => {
    logWidgetAscent('ATTEMPT');
  }, [logWidgetAscent]);

  const handleSend = useCallback(() => {
    logWidgetAscent('SEND');
  }, [logWidgetAscent]);

  const handleGradeSelect = useCallback(
    (newGrade: string) => {
      if (activeGroup && currentLog) {
        updateGrade(activeGroup.id, currentLog.id, newGrade);
      }
    },
    [activeGroup, currentLog, updateGrade]
  );

  const handleCycleAngle = useCallback(() => {
    if (!activeGroup || !currentLog) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    const angles = ['SLAB', 'VERT', 'OVERHANG', 'CAVE'] as const;
    const currentAngle = (currentLog.wallAngle as any) || 'OVERHANG';
    const nextIdx = (angles.indexOf(currentAngle) + 1) % angles.length;
    updateWallAngle(activeGroup.id, currentLog.id, angles[nextIdx]);
  }, [activeGroup, currentLog, updateWallAngle]);

  const handleAddBoulder = useCallback(() => {
    if (!activeGroup) {
      addGroup('Main Wall', 90);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    addLog(activeGroup.id);
  }, [activeGroup, addGroup, addLog]);

  // Volume Key Binding
  useEffect(() => {
    if (!VolumeManager) return;
    VolumeManager.showNativeVolumeUI({ enabled: false });

    const sub = VolumeManager.addVolumeListener((result: { volume: number }) => {
      const prev = (LiveSessionScreen as any)._lastVol ?? result.volume;
      const direction = result.volume >= prev ? 'up' : 'down';
      (LiveSessionScreen as any)._lastVol = result.volume;

      if (direction === 'up') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        logWidgetAscent('SEND');
      } else {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (_) {}
        logWidgetAscent('ATTEMPT');
      }
    });

    return () => {
      sub.remove();
      VolumeManager.showNativeVolumeUI({ enabled: true });
    };
  }, [logWidgetAscent]);

  const handleSaveModal = (data: {
    title: string;
    gymName: string;
    notes: string;
    rpe: number | null;
    mediaUris: string[];
    endTime: number;
    skinState?: string | null;
    fingerFatigue?: string | null;
  }) => {
    setShowCompletionModal(false);
    completeSession({
      title: data.title || activeSession?.gymName || 'Session',
      notes: data.notes || '',
      gymName: data.gymName || activeSession?.gymName || '',
      rpe: data.rpe,
      mediaUris: data.mediaUris,
      endTime: data.endTime,
      skinState: data.skinState,
      fingerFatigue: data.fingerFatigue,
    });
    router.replace('/');
  };

  const handleDiscardModal = () => {
    setShowCompletionModal(false);
    useSessionStore.getState().discardSession();
    router.replace('/');
  };

  const isCurrentSent = currentLog?.outcome === 'send' || currentLog?.outcome === 'flash';
  const isCurrentFlash = currentLog?.outcome === 'flash';

  return (
    <ScreenContainer withTopInset={true}>
      <View className="flex-1 bg-[#111113]">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 48,
            paddingBottom: 170, // Guarantees content clears the massive chalk dock
          }}
        >
          {/* ── 1. Header & Live Indicator ─────────────────────────────────── */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-lg font-black tracking-widest uppercase">
                {activeSession?.gymName || 'CRUX GYM'}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-2 h-2 rounded-full bg-[#6EE756]" />
                <Text className="text-[#6EE756] text-[10px] font-black uppercase tracking-widest">
                  LIVE RECORDING
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowCompletionModal(true)}
              className="bg-[#FF453A]/10 border border-[#FF453A] px-3.5 py-1.5 rounded-xl"
            >
              <Text className="text-[#FF453A] text-xs font-black uppercase tracking-wider">
                WRAP UP
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 2. Tactical 4-Column Grid ──────────────────────────────────── */}
          <View className="bg-[#141417] border border-[#27272F] rounded-2xl py-3.5 mb-4 overflow-hidden">
            <View className="flex-row items-center">
              {/* SENDS */}
              <View className="flex-1 items-center">
                <Text className="text-[#8E7CFF] text-[26px] font-black font-mono">
                  {displaySends}
                </Text>
                <Text className="text-[#555562] text-[9px] font-black uppercase tracking-widest mt-0.5">
                  SENDS
                </Text>
              </View>

              <View className="w-[1px] h-8 bg-[#27272F]" />

              {/* BURNS */}
              <View className="flex-1 items-center">
                <Text className="text-[#FF453A] text-[26px] font-black font-mono">
                  {displayBurns}
                </Text>
                <Text className="text-[#555562] text-[9px] font-black uppercase tracking-widest mt-0.5">
                  BURNS
                </Text>
              </View>

              <View className="w-[1px] h-8 bg-[#27272F]" />

              {/* GRAVITY */}
              <View className="flex-1 items-center">
                <Text className="text-white text-[26px] font-black font-mono">
                  {gravity.toFixed(0)}%
                </Text>
                <Text className="text-[#555562] text-[9px] font-black uppercase tracking-widest mt-0.5">
                  GRAVITY
                </Text>
              </View>

              <View className="w-[1px] h-8 bg-[#27272F]" />

              {/* TIME */}
              <View className="flex-1 items-center">
                <Text className="text-[#9090A0] text-[26px] font-black font-mono">
                  {mm}:{ss}
                </Text>
                <Text className="text-[#555562] text-[9px] font-black uppercase tracking-widest mt-0.5">
                  TIME
                </Text>
              </View>
            </View>

            {/* Micro Burn Strip */}
            {ascents.length > 0 && (
              <View className="flex-row justify-center gap-1.5 mt-3 pt-2.5 border-t border-[#22222A] px-4">
                {[...ascents]
                  .slice(-8)
                  .reverse()
                  .map((a) => (
                    <View
                      key={a.id}
                      className={`w-6 h-6 rounded-md items-center justify-center border ${
                        a.status === 'SEND' || a.status === 'FLASH'
                          ? 'bg-[#8E7CFF]/15 border-[#8E7CFF]'
                          : 'bg-[#19191D] border-[#3E3E48]'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black ${
                          a.status === 'SEND' || a.status === 'FLASH'
                            ? 'text-[#8E7CFF]'
                            : 'text-[#555562]'
                        }`}
                      >
                        {a.status === 'FLASH' ? 'F' : a.status === 'SEND' ? 'S' : '·'}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* ── 3. Active Boulder Card ─────────────────────────────────────── */}
          <View className="bg-[#19191D] border border-[#27272F] rounded-2xl p-4 mb-4">
            {/* Top row: Zone Tag & New Problem Button */}
            <View className="flex-row items-center justify-between mb-3.5 pb-2.5 border-b border-[#22222A]">
              <View className="flex-row items-center gap-1.5 bg-[#141417] border border-[#22222A] px-2.5 py-1 rounded-lg">
                <Layers size={12} color="#8E7CFF" />
                <Text className="text-[#D4D4DC] text-[10px] font-black uppercase tracking-wider">
                  {activeGroup?.zoneName || 'MAIN WALL'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddBoulder}
                className="flex-row items-center gap-1 bg-[#8E7CFF]/10 border border-[#8E7CFF]/30 px-2.5 py-1 rounded-lg"
              >
                <Plus size={11} color="#8E7CFF" strokeWidth={2.5} />
                <Text className="text-[#8E7CFF] text-[10px] font-black uppercase tracking-wider">
                  + NEW PROBLEM
                </Text>
              </TouchableOpacity>
            </View>

            {/* Main Focus Row */}
            <View className="flex-row items-center gap-4">
              {/* Left: Massive Tap Target for Grade */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setGradeSheetVisible(true)}
                className="w-20 h-20 bg-[#141417] border border-[#8E7CFF]/40 rounded-xl items-center justify-center"
              >
                <Text className="text-[#8E7CFF] text-3xl font-black tracking-tight">
                  {currentLog?.gradeRaw ?? 'V5'}
                </Text>
                <Text className="text-[#8E7CFF]/70 text-[8px] font-black uppercase tracking-widest mt-0.5">
                  TAP GRADE
                </Text>
              </TouchableOpacity>

              {/* Right: Status Tags & Burn Count */}
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-2 flex-wrap">
                  {/* Status Tag */}
                  {isCurrentFlash ? (
                    <View className="flex-row items-center gap-1 bg-[#8E7CFF]/20 border border-[#8E7CFF] px-2 py-1 rounded-md">
                      <Zap size={11} color="#8E7CFF" strokeWidth={2.5} />
                      <Text className="text-[#8E7CFF] text-[10px] font-black uppercase tracking-wider">
                        FLASHED
                      </Text>
                    </View>
                  ) : isCurrentSent ? (
                    <View className="flex-row items-center gap-1 bg-[#6EE756]/20 border border-[#6EE756] px-2 py-1 rounded-md">
                      <Check size={11} color="#6EE756" strokeWidth={2.5} />
                      <Text className="text-[#6EE756] text-[10px] font-black uppercase tracking-wider">
                        SENT
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1 bg-[#FF453A]/10 border border-[#FF453A] px-2 py-1 rounded-md">
                      <Flame size={11} color="#FF453A" strokeWidth={2.5} />
                      <Text className="text-[#FF453A] text-[10px] font-black uppercase tracking-wider">
                        ATTEMPTING
                      </Text>
                    </View>
                  )}

                  {/* Wall Angle Tag */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCycleAngle}
                    className="flex-row items-center gap-1 bg-[#141417] border border-[#22222A] px-2 py-1 rounded-md"
                  >
                    <Compass size={11} color="#9090A0" />
                    <Text className="text-[#9090A0] text-[10px] font-black uppercase tracking-wider">
                      {currentLog?.wallAngle ? currentLog.wallAngle.toUpperCase() : 'OVERHANG'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Burn Counter */}
                <View className="flex-row items-baseline gap-2 mt-1">
                  <Text className="text-white text-2xl font-black font-mono">
                    {currentLog?.attempts ?? 1}
                  </Text>
                  <Text className="text-[#70707E] text-[11px] font-bold uppercase tracking-wider">
                    {(currentLog?.attempts ?? 1) === 1 ? 'BURN LOGGED' : 'BURNS LOGGED'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 4. Session Boulders Ledger ─────────────────────────────────── */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-[#70707E] text-[10px] font-black tracking-widest uppercase">
                SESSION BOULDERS
              </Text>
              <Text className="text-[#555562] text-[10px] font-bold tracking-wider uppercase">
                {activeGroup?.logs.length ?? 0} LOGGED
              </Text>
            </View>

            {activeGroup && activeGroup.logs.length > 0 && (
              <View className="bg-[#16161A] border border-[#252530] rounded-2xl overflow-hidden">
                {activeGroup.logs.map((item, idx) => {
                  const isItemSent = item.outcome === 'send' || item.outcome === 'flash';
                  const isItemFlash = item.outcome === 'flash';
                  const meta = GRADE_BY_LABEL[item.gradeRaw];

                  return (
                    <View
                      key={item.id}
                      className={`flex-row items-center justify-between px-4 py-3 ${
                        idx < activeGroup.logs.length - 1 ? 'border-b border-[#202028]' : ''
                      }`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          style={{ backgroundColor: meta?.color ?? '#222228' }}
                          className="w-9 h-7 rounded-lg items-center justify-center"
                        >
                          <Text
                            style={{ color: meta?.textColor ?? '#FFFFFF' }}
                            className="text-xs font-black"
                          >
                            {item.gradeRaw}
                          </Text>
                        </View>

                        <View>
                          <Text className="text-white text-sm font-bold">
                            Problem #{idx + 1}
                          </Text>
                          <Text className="text-[#656575] text-[10px] font-semibold tracking-wide">
                            {item.wallAngle ? item.wallAngle.toUpperCase() : 'VERTICAL'} • {item.attempts}{' '}
                            {item.attempts === 1 ? 'burn' : 'burns'}
                          </Text>
                        </View>
                      </View>

                      {isItemFlash ? (
                        <View className="bg-[#8E7CFF]/20 border border-[#8E7CFF] px-2 py-0.5 rounded-md">
                          <Text className="text-[#8E7CFF] text-[9px] font-black uppercase tracking-wider">
                            FLASH
                          </Text>
                        </View>
                      ) : isItemSent ? (
                        <View className="bg-[#6EE756]/20 border border-[#6EE756] px-2 py-0.5 rounded-md">
                          <Text className="text-[#6EE756] text-[9px] font-black uppercase tracking-wider">
                            SENT
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-[#1F1F26] border border-[#30303E] px-2 py-0.5 rounded-md">
                          <Text className="text-[#808092] text-[9px] font-black uppercase tracking-wider">
                            PROJECT
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Quick Add Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddBoulder}
              className="bg-[#19191D] border border-[#27272F] rounded-xl py-3.5 items-center justify-center flex-row gap-2 mt-1"
            >
              <Plus size={15} color="#8E7CFF" strokeWidth={2.5} />
              <Text className="text-[#8E7CFF] text-xs font-black uppercase tracking-wider">
                ADD ANOTHER BOULDER
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── 5. Floating Rest Timer ───────────────────────────────────────── */}
        <FloatingRestTimer />

        {/* ── 6. Chalk-Safe Bottom Action Dock (CRITICAL) ──────────────────── */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="absolute bottom-0 left-0 right-0 bg-[#111113] border-t border-[#27272F] flex-row"
        >
          {/* Left Button: BURN (+1 ATTEMPT) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              } catch (_) {}
              handleAttempt();
            }}
            className="flex-1 min-h-[96px] bg-[#141417] items-center justify-center py-4 px-3 border-r border-[#27272F]"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Burn (+1 Attempt)"
          >
            <View className="flex-row items-center gap-1 mb-1">
              <Flame size={12} color="#FF453A" strokeWidth={2.5} />
              <Text className="text-[#FF453A] text-[10px] font-black tracking-widest uppercase">
                TAP TO LOG
              </Text>
            </View>
            <Text className="text-[#D4D4DC] text-2xl font-black tracking-widest uppercase">
              BURN
            </Text>
            <Text className="text-[#70707E] text-[11px] font-bold uppercase tracking-wider">
              +1 ATTEMPT
            </Text>
          </TouchableOpacity>

          {/* Right Button: SEND (TOP-OUT) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (_) {}
              handleSend();
            }}
            className="flex-1 min-h-[96px] bg-[#19191D] items-center justify-center py-4 px-3 border-l border-[#8E7CFF]/30"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Send (Top-Out)"
          >
            <View className="flex-row items-center gap-1 mb-1">
              <Zap size={12} color="#8E7CFF" strokeWidth={2.5} />
              <Text className="text-[#8E7CFF] text-[10px] font-black tracking-widest uppercase">
                TAP TO TOP
              </Text>
            </View>
            <Text className="text-[#8E7CFF] text-2xl font-black tracking-widest uppercase">
              SEND
            </Text>
            <Text className="text-[#8E7CFF]/70 text-[11px] font-bold uppercase tracking-wider">
              TOP-OUT
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 7. Grade Selection Sheet ─────────────────────────────────────── */}
        <GradeSheet
          visible={gradeSheetVisible}
          selectedGrade={currentLog?.gradeRaw ?? 'V5'}
          onSelect={handleGradeSelect}
          onClose={() => setGradeSheetVisible(false)}
        />

        {/* ── 8. Session Wrap-Up Modal ─────────────────────────────────────── */}
        {activeSession && (
          <SessionCompletionModal
            visible={showCompletionModal}
            activeSession={activeSession}
            groups={groups}
            pausedEndTime={Date.now()}
            onSave={handleSaveModal}
            onDiscard={handleDiscardModal}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
