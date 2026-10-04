import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  MoreHorizontal,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ClimbRow } from '../../components/ui/ClimbRow';
import { GradePill } from '../../components/ui/GradePill';
import { SyncChip } from '../../components/ui/SyncChip';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LogSheet } from '../../components/session/LogSheet';
import { UndoToast } from '../../components/ui/UndoToast';
import { useTheme } from '../../theme/useTheme';
import {
  useActiveSession,
  useSessionClimbs,
  useRecentGrades,
  useRichProjects,
} from '../../db/hooks';
import { useSessionStore } from '../../store/sessionStore';
import {
  deleteSession,
  softDeleteBoulderLog,
  undoDeleteBoulderLog,
} from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';
import { useCelebration } from '../../components/celebration/CelebrationProvider';
import { useCelebrationStore } from '../../store/celebrationStore';
import {
  shouldFireSmallCelebration,
  shouldFireMediumCelebration,
  shouldFireBigCelebration,
} from '../../utils/celebrationLogic';
import { getDatabase } from '../../db/schema';
import { isSend } from '../../utils/isSend';
import { ResultType } from '../../components/ui/ResultChip';
import { SessionInsights } from '../../components/session/SessionInsights';
import { ProjectCard } from '../../components/ui/ProjectCard';

function formatActiveDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatRestRemaining(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Telemetry Live Timer Component
const LiveTimer = React.memo(({ startTime, textStyle }: { startTime: number; textStyle: any }) => {
  const [elapsed, setElapsed] = useState(Date.now() - startTime);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <Text style={textStyle}>{formatActiveDuration(elapsed)}</Text>;
});

// Telemetry Bento Stat Tile
function TelemetryBentoTile({
  label,
  value,
  sublabel,
  highlightAnim,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  highlightAnim?: Animated.Value;
}) {
  const { colors, type, radius, space } = useTheme();

  const bg = highlightAnim
    ? highlightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.card, colors.accentSoft],
      })
    : colors.card;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 76,
        paddingHorizontal: space.sm,
        paddingVertical: space.sm,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[
          type.stat,
          {
            color: colors.text,
            fontSize: 22,
            lineHeight: 26,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={[
          type.label,
          {
            color: colors.textMuted,
            fontSize: 10,
            letterSpacing: 0.8,
            marginTop: 2,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      {sublabel ? (
        <Text
          style={[
            type.caption,
            {
              color: colors.textMuted,
              fontSize: 9,
              marginTop: 1,
              opacity: 0.8,
            },
          ]}
          numberOfLines={1}
        >
          {sublabel}
        </Text>
      ) : null}
    </Animated.View>
  );
}

// Heavy Sticky Bottom Action Bar with Rest Toggle + + LOG CLIMB button
function StickyActionBar({
  onOpenLogSheet,
  restRemaining,
  isRestRunning,
  isRestComplete,
  onToggleRest,
  onResetRest,
}: {
  onOpenLogSheet: () => void;
  restRemaining: number;
  isRestRunning: boolean;
  isRestComplete: boolean;
  onToggleRest: () => void;
  onResetRest: () => void;
}) {
  const { colors, radius, type, space, shadow } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000',
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: Math.max(insets.bottom, space.md),
        flexDirection: 'row',
        gap: space.md,
        alignItems: 'center',
        ...shadow.floating,
      }}
    >
      {/* Secondary REST Toggle */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onToggleRest}
        onLongPress={onResetRest}
        accessibilityRole="button"
        accessibilityLabel="Rest Timer"
        style={{
          flex: 0.85,
          height: 56,
          minHeight: 56,
          borderRadius: radius.pill,
          backgroundColor: isRestComplete
            ? 'rgba(110, 231, 86, 0.1)' // flashSoft equivalent ghost
            : isRestRunning
            ? 'rgba(168, 114, 255, 0.1)' // accentSoft equivalent ghost
            : colors.materialBase,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space.md,
          gap: space.xs,
        }}
      >
        {isRestComplete ? (
          <Clock size={18} color={colors.flashText} />
        ) : isRestRunning ? (
          <Pause size={18} color={colors.accentText} />
        ) : (
          <Clock size={18} color={colors.textMuted} />
        )}
        <View style={{ alignItems: 'flex-start' }}>
          <Text
            style={[
              type.label,
              {
                color: isRestComplete
                  ? colors.flashText
                  : isRestRunning
                  ? colors.accentText
                  : colors.textMuted,
                fontSize: 10,
                letterSpacing: 0.8,
              },
            ]}
          >
            {isRestComplete ? 'REST DONE' : isRestRunning ? 'RESTING' : 'REST'}
          </Text>
          <Text
            style={[
              type.heading,
              {
                color: isRestComplete
                  ? colors.flashText
                  : isRestRunning
                  ? colors.accentText
                  : colors.text,
                fontSize: 14,
                fontVariant: ['tabular-nums'],
              },
            ]}
          >
            {isRestComplete
              ? 'READY'
              : isRestRunning
              ? formatRestRemaining(restRemaining)
              : '3:00'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Massive + LOG CLIMB PrimaryButton */}
      <View style={{ flex: 1.15 }}>
        <PrimaryButton
          testID="log-climb-btn"
          icon={<Plus color={colors.textOnAccent} size={22} strokeWidth={2.5} />}
          label="LOG CLIMB"
          onPress={onOpenLogSheet}
        />
      </View>
    </View>
  );
}

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { colors, space, type, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const session = useActiveSession();
  const climbs = useSessionClimbs(session?.id || '');
  const recentGrades = useRecentGrades() || [];
  const allProjects = useRichProjects();

  const {
    logGenericAscent,
    setActiveSessionId,
    restTimerEndTime,
    isRestTimerRunning,
    setRestTimer,
  } = useSessionStore();

  const [isLogSheetOpen, setLogSheetOpen] = useState(climbs.filter((c: any) => c.deleted_at === null).length === 0);
  const [editingClimb, setEditingClimb] = useState<any>(null);
  const [deletedClimbId, setDeletedClimbId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [restRemaining, setRestRemaining] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Filter out soft-deleted climbs from UI display
  const activeClimbs = useMemo(
    () => climbs.filter((c: any) => c.deleted_at === null),
    [climbs]
  );

  // Projects strip: in-progress projects at the current gym
  const activeProjects = useMemo(() => {
    if (!session?.gymName) return [];
    return allProjects.filter(
      (p: any) => p.status === 'in_progress' && p.gymName === session.gymName
    );
  }, [allProjects, session?.gymName]);

  const sends = useMemo(
    () => activeClimbs.filter((c: any) => isSend(c.result)),
    [activeClimbs]
  );
  const flashes = useMemo(
    () => activeClimbs.filter((c: any) => c.result === 'flash'),
    [activeClimbs]
  );

  const sendRate = activeClimbs.length > 0
    ? Math.round((sends.length / activeClimbs.length) * 100)
    : 0;

  const hardestIndex = useMemo(() => {
    return sends.reduce((max: number, c: any) => Math.max(max, c.grade_index ?? 0), 0);
  }, [sends]);

  const hardestLabel =
    sends.length > 0
      ? sends.find((c: any) => (c.grade_index ?? 0) === hardestIndex)?.grade_raw || '–'
      : '–';

  // Rest Timer calculation
  useEffect(() => {
    if (!restTimerEndTime || !isRestTimerRunning) {
      if (restTimerEndTime && !isRestTimerRunning) {
        setRestRemaining(Math.max(0, restTimerEndTime - Date.now()));
      } else {
        setRestRemaining(0);
      }
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const left = Math.max(0, restTimerEndTime - now);
      setRestRemaining(left);

      if (left === 0) {
        setRestTimer(null, false);
        triggerHaptic('success');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [restTimerEndTime, isRestTimerRunning, setRestTimer]);

  const handleToggleRest = () => {
    triggerHaptic('medium');
    if (!restTimerEndTime || restRemaining === 0) {
      // Start fresh 3:00 rest
      setRestTimer(Date.now() + 3 * 60 * 1000, true);
    } else if (isRestTimerRunning) {
      // Pause
      setRestTimer(Date.now() + restRemaining, false);
    } else {
      // Resume
      setRestTimer(Date.now() + restRemaining, true);
    }
  };

  const handleResetRest = () => {
    triggerHaptic('light');
    setRestTimer(null, false);
    setRestRemaining(0);
  };

  const isRestComplete = restTimerEndTime !== null && restRemaining === 0;

  const { triggerSmall, triggerMedium, triggerBig } = useCelebration();
  const { hasCelebrated, markCelebrated } = useCelebrationStore();

  const [globalHardest, setGlobalHardest] = useState<number | null>(null);
  const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const db = getDatabase();
      const logsRow = db.getFirstSync<any>(
        'SELECT MAX(grade_index) as m FROM boulder_logs WHERE result IN ("flash", "top", "send") AND deleted_at IS NULL AND session_id != ?',
        [session?.id]
      );
      setGlobalHardest(logsRow?.m ?? null);

      const sessionRow = db.getFirstSync<any>(
        'SELECT count(*) as c FROM sessions WHERE end_time IS NOT NULL AND id != ?',
        [session?.id]
      );
      setTotalSessionsCount(sessionRow?.c ?? 0);
    } catch (e) {
      console.log('Error fetching global stats', e);
    }
  }, [session?.id]);

  const prevActiveClimbsLength = useRef(activeClimbs.length);

  useEffect(() => {
    if (activeClimbs.length > prevActiveClimbsLength.current) {
      for (const c of activeClimbs) {
        if (hasCelebrated(c.id)) continue;

        let celebrated = false;
        if (shouldFireBigCelebration(c.result, c.project_id)) {
          const proj = allProjects.find((p: any) => p.id === c.project_id);
          triggerBig({
            nickname: proj?.title || 'Project',
            gradeRaw: proj?.grade || c.grade_raw,
            burns: proj?.burns || 1,
            sessions: proj?.sessions || 1,
          });
          markCelebrated(c.id, 'big');
          celebrated = true;
        } else if (
          shouldFireMediumCelebration(c.grade_index, globalHardest, totalSessionsCount)
        ) {
          triggerMedium(`New hardest: ${c.grade_raw}`);
          markCelebrated(c.id, 'medium');
          setGlobalHardest(Math.max(globalHardest ?? 0, c.grade_index));
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
            Animated.timing(pulseAnim, { toValue: 0, duration: 400, delay: 600, useNativeDriver: false }),
          ]).start();
          celebrated = true;
        } else if (shouldFireSmallCelebration(c.result)) {
          triggerSmall();
          markCelebrated(c.id, 'small');
          celebrated = true;
        }
      }
    }
    prevActiveClimbsLength.current = activeClimbs.length;
  }, [
    activeClimbs,
    globalHardest,
    totalSessionsCount,
    allProjects,
    hasCelebrated,
    markCelebrated,
    triggerBig,
    triggerMedium,
    triggerSmall,
  ]);

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[type.body, { color: colors.textMuted }]}>No active session.</Text>
      </View>
    );
  }

  const handleSaveLog = (
    grade: string,
    result: ResultType,
    attempts: number,
    notes: string
  ) => {
    triggerHaptic('medium');
    const newId = logGenericAscent({
      gradeRaw: grade,
      outcome: result === 'top' ? 'send' : result,
      movesLinked: attempts,
      notes,
    });
    setDeletedClimbId(newId);
    setLogSheetOpen(false);
    setEditingClimb(null);

    // Auto-start rest timer
    setRestTimer(Date.now() + 3 * 60 * 1000, true);
  };

  const handleDeleteClimb = (id: string) => {
    triggerHaptic('light');
    softDeleteBoulderLog(id);
    setDeletedClimbId(id);
  };

  const handleUndoDelete = () => {
    if (deletedClimbId) {
      triggerHaptic('light');
      undoDeleteBoulderLog(deletedClimbId);
      setDeletedClimbId(null);
    }
  };

  const handleDiscardSession = () => {
    setShowMenu(false);
    Alert.alert(
      'Discard Session',
      `Are you sure you want to discard this session? ${activeClimbs.length} climb(s) will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard session',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('heavy');
            deleteSession(session.id);
            setActiveSessionId(null);
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleEditClimb = (climb: any) => {
    softDeleteBoulderLog(climb.id);
    setEditingClimb({
      grade: climb.grade_raw,
      result: (climb.result === 'send' ? 'top' : climb.result) as ResultType,
      attempts: climb.attempts ?? 1,
      notes: climb.notes || '',
    });
    setLogSheetOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Header Bar */}
      <View
        style={{
          paddingTop: Math.max(insets.top, space.lg),
          paddingHorizontal: space.lg,
          paddingBottom: space.xs,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        {/* Left: Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Center: Gym Name & Sync */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <Text style={[type.heading, { color: colors.text, fontSize: 16 }]} numberOfLines={1}>
            {session.gymName || 'Session'}
          </Text>
          <SyncChip state="synced" />
        </View>

        {/* Right: Menu & End */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/session/end')}
            accessibilityRole="button"
            accessibilityLabel="End session"
            style={{
              height: 44,
              paddingHorizontal: 14,
              borderRadius: radius.md,
              backgroundColor: colors.cardMuted,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu Overlay */}
        {showMenu && (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.md,
                top: insets.top + 48,
                right: space.lg,
              },
            ]}
          >
            <TouchableOpacity
              style={{
                padding: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
              onPress={() => {
                setShowMenu(false);
                router.push(('/session/detail/' + session.id + '?variant=edit') as any);
              }}
            >
              <Text style={[type.body, { color: colors.text }]}>Change gym</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDiscardSession} style={{ padding: space.md }}>
              <Text style={[type.body, { color: colors.dangerText }]}>Discard session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Telemetry ScrollView */}
      <Reanimated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.sm,
          paddingBottom: 170, // Generous padding to clear sticky action bar
          gap: space.lg,
        }}
      >
        {/* 1. Hero Telemetry Card — Live Elapsed Timer */}
        <Card style={{ alignItems: 'center', paddingVertical: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.flash,
              }}
            />
            <Text style={[type.label, { color: colors.textMuted }]}>
              LIVE TELEMETRY
            </Text>
          </View>
          <LiveTimer
            startTime={session.startTime}
            textStyle={[
              type.stat,
              {
                color: colors.textWhitePrimary,
                fontSize: 44,
                lineHeight: 50,
                letterSpacing: -0.5,
                fontWeight: '200',
                fontVariant: ['tabular-nums'],
              },
            ]}
          />
        </Card>

        {/* 2. Telemetry Bento Grid — Volume, Send Rate, Flashes, Hardest */}
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <TelemetryBentoTile
            label="VOLUME"
            value={activeClimbs.length}
            sublabel="climbs"
          />
          <TelemetryBentoTile
            label="SEND RATE"
            value={`${sendRate}%`}
            sublabel={`${sends.length} sent`}
          />
          <TelemetryBentoTile
            label="FLASHES"
            value={flashes.length}
            sublabel="flashed"
          />
          <TelemetryBentoTile
            label="HARDEST"
            value={hardestLabel}
            sublabel={sends.length > 0 ? 'top send' : 'no sends'}
            highlightAnim={pulseAnim}
          />
        </View>

        {/* 3. Fast Repeat / +1 Attempt Quick Action */}
        {activeClimbs.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              triggerHaptic('light');
              const lastClimb = activeClimbs[0];
              const gradeToUse = {
                gradeRaw: lastClimb.grade_raw,
                gradeIndex: lastClimb.grade_index,
              };
              const attemptId = logGenericAscent({
                gradeRaw: gradeToUse.gradeRaw,
                outcome: 'attempt',
                movesLinked: 1,
                notes: '',
              });
              setDeletedClimbId(attemptId);
              setRestTimer(Date.now() + 3 * 60 * 1000, true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Quick +1 Attempt"
            style={{
              height: 56,
              minHeight: 56,
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.md,
              gap: space.sm,
            }}
          >
            <Plus size={20} color={colors.attemptText} />
            <Text style={[type.heading, { color: colors.text, fontSize: 15 }]}>
              +1 Attempt on {activeClimbs[0]?.grade_raw}
            </Text>
          </TouchableOpacity>
        )}

        {/* 4. Active Projects Strip */}
        {activeProjects.length > 0 && (
          <View>
            <SectionHeader title="Active Gym Projects" />
            <Reanimated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -space.lg }}
            >
              <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, gap: space.sm }}>
                {activeProjects.map((p: any) => (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/projects/${p.id}` as any)}
                    style={{ width: 260 }}
                  >
                    <ProjectCard
                      project={p}
                      onLogAttempt={() => {
                        triggerHaptic('light');
                        const attemptId = logGenericAscent({
                          projectId: p.id,
                          gradeRaw: p.gradeRaw ?? p.grade_raw,
                          outcome: 'attempt',
                          movesLinked: 1,
                          notes: '',
                        });
                        setDeletedClimbId(attemptId);
                        setRestTimer(Date.now() + 3 * 60 * 1000, true);
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Reanimated.ScrollView>
          </View>
        )}

        {/* 5. Session Insights */}
        {activeClimbs.length > 0 && <SessionInsights climbs={activeClimbs} />}

        {/* 6. Climbs Stream */}
        <View style={{ gap: space.sm }}>
          <SectionHeader title={activeClimbs.length > 0 ? `Climb Stream (${activeClimbs.length})` : 'Climb Stream'} />

          {[...activeClimbs]
            .sort((a: any, b: any) => b.logged_at - a.logged_at)
            .map((climb: any) => (
              <ClimbRow
                key={climb.id}
                climb={climb}
                onEdit={handleEditClimb}
                onDelete={handleDeleteClimb}
                animateEntry={Date.now() - climb.logged_at < 5000}
                isNewFlash={climb.result === 'flash' && Date.now() - climb.logged_at < 5000}
              />
            ))}

          {activeClimbs.length === 0 && (
            <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
              <Text style={[type.heading, { color: colors.text, marginBottom: space.xs }]}>
                Ready to send?
              </Text>
              <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
                Tap + LOG CLIMB below to record your first climb of this session.
              </Text>
            </Card>
          )}
        </View>
      </Reanimated.ScrollView>

      {/* Heavy, Sticky Bottom Action Bar with REST Toggle and + LOG CLIMB */}
      <StickyActionBar
        onOpenLogSheet={() => {
          setEditingClimb(null);
          setLogSheetOpen(true);
        }}
        restRemaining={restRemaining}
        isRestRunning={isRestTimerRunning}
        isRestComplete={isRestComplete}
        onToggleRest={handleToggleRest}
        onResetRest={handleResetRest}
      />

      {/* Sliding Bottom-Sheet Modal for Climb Logging */}
      <LogSheet
        visible={isLogSheetOpen}
        onClose={() => {
          setLogSheetOpen(false);
          setEditingClimb(null);
        }}
        onSave={handleSaveLog}
        initialGrade={editingClimb?.grade || recentGrades[0]?.gradeRaw || 'V4'}
        initialResult={editingClimb?.result || 'top'}
        initialAttempts={editingClimb?.attempts || 1}
        initialNotes={editingClimb?.notes || ''}
      />

      {/* Undo Toast */}
      <UndoToast
        visible={!!deletedClimbId}
        message={
          climbs.find((c: any) => c.id === deletedClimbId)?.deleted_at === null
            ? 'Climb logged'
            : 'Climb deleted'
        }
        onUndo={handleUndoDelete}
        onDismiss={() => setDeletedClimbId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: 200,
    borderWidth: 1,
    zIndex: 50,
  },
});
