
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import Reanimated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  MoreHorizontal,
  Clock,
  Pause,
  RotateCcw,
  Zap,
  Target,
  X,
  SlidersHorizontal,
} from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ClimbRow } from '../../components/ui/ClimbRow';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LogSheet } from '../../components/session/LogSheet';
import { RestTimerPickerSheet, formatRestDuration } from '../../components/session/RestTimerPickerSheet';
import { UndoToast } from '../../components/ui/UndoToast';
import { ScalePressable } from '../../components/ui/ScalePressable';
import { EmptyState } from '../../components/ui/EmptyState';
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
  updateClimb,
  promoteClimbToProject,
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
import type { FailureReason } from '../../types';

const REST_TIMER_KEY = '@cruxlog/rest_timer_seconds';
const DEFAULT_REST_SECONDS = 180;

function formatActiveDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatRestRemaining(ms: number) {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
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
LiveTimer.displayName = 'LiveTimer';

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

// Heavy Sticky Bottom Action Bar with Rest Toggle + Visible Rest Controls + LOG CLIMB button
function StickyActionBar({
  onOpenLogSheet,
  restRemaining,
  defaultRestSeconds,
  isRestRunning,
  isRestComplete,
  onToggleRest,
  onResetRest,
  onAddRestSeconds,
  onOpenRestPicker,
}: {
  onOpenLogSheet: () => void;
  restRemaining: number;
  defaultRestSeconds: number;
  isRestRunning: boolean;
  isRestComplete: boolean;
  onToggleRest: () => void;
  onResetRest: () => void;
  onAddRestSeconds: (secs: number) => void;
  onOpenRestPicker: () => void;
}) {
  const { colors, radius, type, space, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const hasActiveRest = isRestRunning || restRemaining > 0 || isRestComplete;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000',
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: Math.max(insets.bottom, space.md),
        gap: space.xs,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadow.floating,
      }}
    >
      {/* Visible 1-handed Rest Timer quick actions when resting or complete */}
      {hasActiveRest && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: space.xs,
            paddingBottom: 2,
          }}
        >
          <Text style={[type.caption, { color: isRestComplete ? colors.flashText : colors.accentText, fontWeight: '600' }]}>
            {isRestComplete
              ? 'Rest complete — ready for next burn'
              : isRestRunning
              ? `Resting · ${formatRestRemaining(restRemaining)} left`
              : `Rest paused · ${formatRestRemaining(restRemaining)} left`}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
            {!isRestComplete && (
              <ScalePressable
                onPress={() => onAddRestSeconds(30)}
                haptic="selection"
                activeScale={0.94}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Add 30 seconds to rest"
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: colors.cardMuted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={[type.caption, { color: colors.text, fontWeight: '700' }]}>+30s</Text>
              </ScalePressable>
            )}
            <ScalePressable
              onPress={onResetRest}
              haptic="light"
              activeScale={0.94}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Reset rest timer"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radius.pill,
                backgroundColor: colors.cardMuted,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <RotateCcw size={12} color={colors.textMuted} />
              <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>Reset</Text>
            </ScalePressable>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        {/* Secondary REST Toggle */}
        <ScalePressable
          onPress={onToggleRest}
          onLongPress={onOpenRestPicker}
          haptic="light"
          activeScale={0.96}
          accessibilityRole="button"
          accessibilityLabel="Rest Timer"
          style={{
            flex: 0.85,
            height: 56,
            minHeight: 56,
            borderRadius: radius.pill,
            backgroundColor: isRestComplete
              ? 'rgba(110, 231, 86, 0.12)'
              : isRestRunning
              ? 'rgba(142, 124, 255, 0.15)'
              : colors.materialBase,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: space.md,
            gap: space.xs,
            borderWidth: 1,
            borderColor: isRestComplete
              ? colors.flash
              : isRestRunning
              ? colors.accent
              : colors.border,
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
                : isRestRunning || restRemaining > 0
                ? formatRestRemaining(restRemaining)
                : formatRestRemaining(defaultRestSeconds * 1000)}
            </Text>
          </View>
        </ScalePressable>

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
    addRestTimerSeconds,
    activeProjectTarget,
    setActiveProjectTarget,
  } = useSessionStore();

  const [isLogSheetOpen, setLogSheetOpen] = useState(false);
  const [isRestPickerOpen, setIsRestPickerOpen] = useState(false);
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(DEFAULT_REST_SECONDS);
  const [editingClimb, setEditingClimb] = useState<any>(null);
  const [selectedQuickGrade, setSelectedQuickGrade] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{
    type: 'logged' | 'deleted' | 'project_created';
    climbId: string;
    message?: string;
  } | null>(null);
  const [projectCandidate, setProjectCandidate] = useState<{
    climbId: string;
    gradeRaw: string;
  } | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [restRemaining, setRestRemaining] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Hydrate user's preferred rest timer length
  useEffect(() => {
    AsyncStorage.getItem(REST_TIMER_KEY)
      .then((val) => {
        if (val) {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed) && parsed >= 10 && parsed <= 600) {
            setDefaultRestSeconds(parsed);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveDefaultRest = (secs: number) => {
    setDefaultRestSeconds(secs);
    AsyncStorage.setItem(REST_TIMER_KEY, String(secs)).catch(() => {});
    if (isRestTimerRunning) {
      setRestTimer(Date.now() + secs * 1000, true);
    }
  };

  // Filter out soft-deleted climbs from UI display
  const activeClimbs = useMemo(
    () => climbs.filter((c: any) => c.deleted_at === null),
    [climbs]
  );

  // Projects strip: in-progress projects at the current gym (or all in-progress if none match gym)
  const activeProjects = useMemo(() => {
    const inProg = allProjects.filter((p: any) => p.status === 'in_progress');
    if (!session?.gymName) return inProg;
    const atGym = inProg.filter((p: any) => !p.gymName || p.gymName === session.gymName);
    return atGym.length > 0 ? atGym : inProg;
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

  useEffect(() => {
    if (activeProjectTarget && !isLogSheetOpen) {
      setLogSheetOpen(true);
    }
  }, [activeProjectTarget]);

  // Keep iOS Live Activity (Dynamic Island + Lock Screen) synced with session telemetry
  useEffect(() => {
    try {
      const { liveActivityManager } = require('../../services/liveActivity');
      liveActivityManager.syncFromDatabase();
    } catch {}
  }, [session?.id, session?.gymName, activeClimbs.length, sends.length]);

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

  const startFreshRest = () => {
    setRestTimer(Date.now() + defaultRestSeconds * 1000, true);
  };

  const handleToggleRest = () => {
    triggerHaptic('medium');
    if (!restTimerEndTime || restRemaining === 0) {
      startFreshRest();
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

  const handleAddRestSeconds = (secs: number) => {
    triggerHaptic('selection');
    addRestTimerSeconds(secs);
    setRestRemaining((prev) => prev + secs * 1000);
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
      console.warn('Error fetching global stats', e);
    }
  }, [session?.id]);

  const prevActiveClimbsLength = useRef(activeClimbs.length);

  useEffect(() => {
    if (activeClimbs.length > prevActiveClimbsLength.current) {
      for (const c of activeClimbs) {
        if (hasCelebrated(c.id)) continue;

        if (shouldFireBigCelebration(c.result, c.project_id)) {
          const proj = allProjects.find((p: any) => p.id === c.project_id);
          triggerBig({
            nickname: proj?.title || 'Project',
            gradeRaw: proj?.grade || c.grade_raw,
            burns: proj?.burns || 1,
            sessions: proj?.sessions || 1,
          });
          markCelebrated(c.id, 'big');
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
        } else if (shouldFireSmallCelebration(c.result)) {
          triggerSmall();
          markCelebrated(c.id, 'small');
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
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, space.lg),
          paddingHorizontal: space.lg,
        }}
      >
        <ScalePressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.lg,
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </ScalePressable>
        <EmptyState
          asCard
          icon={<Zap size={28} color={colors.accent} />}
          title="No Active Session"
          body="You don't have an ongoing climbing session right now. Start a new session to record your climbs and telemetry."
          cta={
            <PrimaryButton
              label="+ START SESSION"
              onPress={() => {
                useSessionStore.getState().startQuickSession('Local Gym');
              }}
            />
          }
        />
      </View>
    );
  }

  const handleSaveLog = (
    grade: string,
    result: ResultType,
    attempts: number,
    notes: string,
    failureReason?: FailureReason | null,
    selectedProj?: any | null
  ) => {
    triggerHaptic('medium');
    if (editingClimb) {
      updateClimb(editingClimb.id, {
        gradeRaw: grade,
        result: result === 'top' ? 'send' : result,
        attempts,
        notes,
        failureReason: result === 'attempt' ? (failureReason ?? null) : null,
        projectId: selectedProj ? selectedProj.id : editingClimb.projectId ?? null,
      });
      setLogSheetOpen(false);
      setEditingClimb(null);
      setSelectedQuickGrade(null);
      return;
    }

    const targetProject = selectedProj || activeProjectTarget;
    const newId = logGenericAscent({
      gradeRaw: grade,
      outcome: result === 'top' ? 'send' : result,
      movesLinked: attempts,
      notes,
      failureReason: result === 'attempt' ? (failureReason ?? null) : null,
      projectId: targetProject ? targetProject.id : undefined,
      wallAngle: targetProject ? targetProject.wallAngle : undefined,
      holdType: targetProject ? targetProject.holdType : undefined,
    });

    setLastAction({ type: 'logged', climbId: newId });
    if (result === 'attempt' && !targetProject) {
      setProjectCandidate({ climbId: newId, gradeRaw: grade });
    } else {
      setProjectCandidate(null);
    }

    setLogSheetOpen(false);
    setEditingClimb(null);
    setSelectedQuickGrade(null);
    if (activeProjectTarget) {
      setActiveProjectTarget(null);
    }

    // Auto-start rest timer with user's configured duration
    startFreshRest();
  };

  const handlePromoteToProject = () => {
    if (!projectCandidate) return;
    triggerHaptic('success');
    const created = promoteClimbToProject(projectCandidate.climbId, session.gymName);
    setProjectCandidate(null);
    if (created) {
      setLastAction({
        type: 'project_created',
        climbId: projectCandidate.climbId,
        message: `Saved ${created.title}`,
      });
    }
  };

  const handleDeleteClimb = (id: string) => {
    triggerHaptic('light');
    softDeleteBoulderLog(id);
    if (projectCandidate?.climbId === id) {
      setProjectCandidate(null);
    }
    setLastAction({ type: 'deleted', climbId: id });
  };

  const handleUndoAction = () => {
    if (lastAction) {
      triggerHaptic('light');
      if (lastAction.type === 'logged') {
        softDeleteBoulderLog(lastAction.climbId);
        if (projectCandidate?.climbId === lastAction.climbId) {
          setProjectCandidate(null);
        }
      } else if (lastAction.type === 'deleted') {
        undoDeleteBoulderLog(lastAction.climbId);
      }
      setLastAction(null);
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
            setRestTimer(null, false);
            deleteSession(session.id);
            setActiveSessionId(null);
            try {
              require('../../services/liveActivity').liveActivityManager.endSession();
            } catch {}
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleEditClimb = (climb: any) => {
    triggerHaptic('light');
    setEditingClimb({
      id: climb.id,
      grade: climb.grade_raw,
      result: (climb.result === 'send' ? 'top' : climb.result) as ResultType,
      attempts: climb.attempts ?? 1,
      notes: climb.notes || '',
      failureReason: climb.failure_reason || null,
      projectId: climb.project_id,
    });
    setLogSheetOpen(true);
  };

  const handleEndPress = () => {
    triggerHaptic('medium');
    if (activeClimbs.length === 0) {
      Alert.alert(
        'End Session',
        'No climbs were logged in this session. What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard Session',
            style: 'destructive',
            onPress: () => {
              triggerHaptic('heavy');
              setRestTimer(null, false);
              deleteSession(session.id);
              setActiveSessionId(null);
              try {
                require('../../services/liveActivity').liveActivityManager.endSession();
              } catch {}
              router.replace('/');
            },
          },
          {
            text: 'Save Empty Session',
            onPress: () => router.push('/session/end'),
          },
        ]
      );
    } else {
      router.push('/session/end');
    }
  };

  const lastClimb = activeClimbs.length > 0 ? activeClimbs[activeClimbs.length - 1] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {showMenu && (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
          onPress={() => setShowMenu(false)}
        />
      )}
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
        <ScalePressable
          onPress={() => router.back()}
          haptic="light"
          activeScale={0.92}
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
        </ScalePressable>

        {/* Center: Gym Name */}
        <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: space.sm }}>
          <Text style={[type.heading, { color: colors.text, fontSize: 16 }]} numberOfLines={1}>
            {session.gymName || 'Session'}
          </Text>
        </View>

        {/* Right: Menu & End */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <ScalePressable
            onPress={() => setShowMenu(!showMenu)}
            haptic="light"
            activeScale={0.92}
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
          </ScalePressable>
          <ScalePressable
            testID="end-session-btn"
            onPress={handleEndPress}
            haptic="medium"
            activeScale={0.94}
            accessibilityRole="button"
            accessibilityLabel="End session"
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: radius.md,
              backgroundColor: colors.cardMuted,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[type.heading, { color: colors.text, fontSize: 14, fontWeight: '600' }]}>End</Text>
          </ScalePressable>
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
              accessibilityRole="button"
              accessibilityLabel="Rest timer duration"
              style={{
                padding: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onPress={() => {
                setShowMenu(false);
                setIsRestPickerOpen(true);
              }}
            >
              <Text style={[type.body, { color: colors.text }]}>Rest timer</Text>
              <Text style={[type.caption, { color: colors.accentText, fontWeight: '600' }]}>
                {formatRestDuration(defaultRestSeconds)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change gym"
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
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Discard session"
              onPress={handleDiscardSession}
              style={{ padding: space.md }}
            >
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
          paddingBottom: 190, // Generous padding to clear sticky action bar & toast
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

        {/* 3. Quick Grade Strip for 1-Tap Grade Pre-Selection */}
        <View style={{ gap: space.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[type.caption, { color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10, fontWeight: '600' }]}>
              QUICK GRADE LOG
            </Text>
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                setIsRestPickerOpen(true);
              }}
              haptic="light"
              activeScale={0.95}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <SlidersHorizontal size={12} color={colors.textMuted} />
              <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]}>
                Rest: {formatRestDuration(defaultRestSeconds)}
              </Text>
            </ScalePressable>
          </View>
          <Reanimated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.xs, paddingVertical: 2 }}
          >
            {Array.from(
              new Set(['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', ...recentGrades.map((rg: any) => rg.gradeRaw)])
            ).map((g: string) => (
              <ScalePressable
                key={g}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedQuickGrade(g);
                  setEditingClimb(null);
                  setLogSheetOpen(true);
                }}
                haptic="light"
                activeScale={0.92}
                style={{
                  height: 40,
                  minWidth: 48,
                  paddingHorizontal: space.md,
                  borderRadius: radius.pill,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[type.heading, { color: colors.text, fontSize: 13, fontWeight: '600' }]}>
                  {g}
                </Text>
              </ScalePressable>
            ))}
          </Reanimated.ScrollView>
        </View>

        {/* 4. Non-blocking "Make this a project?" prompt after logging an Attempt */}
        {projectCandidate && (
          <Reanimated.View
            entering={FadeInDown.duration(180)}
            exiting={FadeOutUp.duration(150)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.accent,
              padding: space.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: space.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target size={18} color={colors.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text, fontSize: 14, fontWeight: '700' }]}>
                  Working on this {projectCandidate.gradeRaw}?
                </Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 1 }]}>
                  Track attempts across sessions
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <ScalePressable
                testID="make-project-btn"
                onPress={handlePromoteToProject}
                haptic="medium"
                activeScale={0.95}
                accessibilityRole="button"
                accessibilityLabel="Make this a project"
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: space.md,
                  height: 38,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[type.control, { color: colors.textOnAccent, fontWeight: '700', fontSize: 13 }]}>
                  Make project
                </Text>
              </ScalePressable>

              <ScalePressable
                onPress={() => setProjectCandidate(null)}
                haptic="light"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Dismiss project prompt"
                style={{ padding: 4 }}
              >
                <X size={18} color={colors.textMuted} />
              </ScalePressable>
            </View>
          </Reanimated.View>
        )}

        {/* 5. Fast Repeat / +1 Attempt Quick Action */}
        {lastClimb && (
          <ScalePressable
            onPress={() => {
              const attemptId = logGenericAscent({
                gradeRaw: lastClimb.grade_raw,
                outcome: 'attempt',
                movesLinked: 1,
                notes: '',
                projectId: lastClimb.project_id || undefined,
              });
              setLastAction({ type: 'logged', climbId: attemptId });
              if (!lastClimb.project_id) {
                setProjectCandidate({ climbId: attemptId, gradeRaw: lastClimb.grade_raw });
              }
              startFreshRest();
            }}
            haptic="medium"
            activeScale={0.97}
            accessibilityRole="button"
            accessibilityLabel="Quick +1 Attempt"
            style={{
              height: 52,
              minHeight: 52,
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
            <Plus size={18} color={colors.attemptText} />
            <Text style={[type.heading, { color: colors.text, fontSize: 15, fontWeight: '600' }]}>
              +1 Attempt on {lastClimb.projectTitle ? `${lastClimb.projectTitle} (${lastClimb.grade_raw})` : lastClimb.grade_raw}
            </Text>
          </ScalePressable>
        )}

        {/* 6. Active Projects Strip */}
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
                  <View
                    key={p.id}
                    style={{ width: 260 }}
                  >
                    <ProjectCard
                      project={p}
                      onLogAttempt={() => {
                        const attemptId = logGenericAscent({
                          projectId: p.id,
                          gradeRaw: p.gradeRaw ?? p.grade_raw,
                          outcome: 'attempt',
                          movesLinked: 1,
                          notes: '',
                        });
                        setLastAction({ type: 'logged', climbId: attemptId });
                        startFreshRest();
                      }}
                    />
                  </View>
                ))}
              </View>
            </Reanimated.ScrollView>
          </View>
        )}

        {/* 7. Session Insights */}
        {activeClimbs.length > 0 && <SessionInsights climbs={activeClimbs} />}

        {/* 8. Climbs Stream */}
        <View testID="climb-list" style={{ gap: space.sm }}>
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
            <EmptyState
              asCard
              icon={<Zap size={24} color={colors.accent} />}
              title="Ready to send?"
              body="Tap a quick grade above or + LOG CLIMB below to record your first climb."
            />
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
        defaultRestSeconds={defaultRestSeconds}
        isRestRunning={isRestTimerRunning}
        isRestComplete={isRestComplete}
        onToggleRest={handleToggleRest}
        onResetRest={handleResetRest}
        onAddRestSeconds={handleAddRestSeconds}
        onOpenRestPicker={() => setIsRestPickerOpen(true)}
      />

      {/* Sliding Bottom-Sheet Modal for Climb Logging */}
      <LogSheet
        visible={isLogSheetOpen}
        onClose={() => {
          setLogSheetOpen(false);
          setEditingClimb(null);
          setSelectedQuickGrade(null);
          if (activeProjectTarget) {
            setActiveProjectTarget(null);
          }
        }}
        onSave={handleSaveLog}
        initialGrade={editingClimb?.grade || selectedQuickGrade || activeProjectTarget?.gradeRaw || lastClimb?.grade_raw || recentGrades[0]?.gradeRaw || 'V4'}
        initialResult={editingClimb?.result || (activeProjectTarget ? 'attempt' : 'top')}
        initialAttempts={editingClimb?.attempts || 1}
        initialNotes={editingClimb?.notes || ''}
        initialFailureReason={editingClimb?.failureReason || null}
        lockGrade={Boolean(editingClimb && editingClimb.projectId)}
        disableFlash={Boolean(
          (activeProjectTarget && ((activeProjectTarget.attempts || 0) > 0 || (activeProjectTarget.burns || 0) > 0)) ||
          (editingClimb && (editingClimb.attempts || 1) > 1)
        )}
        title={activeProjectTarget ? `Log Attempt • ${activeProjectTarget.title}` : editingClimb ? 'Edit Climb' : 'Log Climb'}
        projects={editingClimb ? [] : activeProjects}
        selectedProject={activeProjectTarget}
        onSelectProject={setActiveProjectTarget}
      />

      {/* Rest Timer Duration Picker Sheet */}
      <RestTimerPickerSheet
        visible={isRestPickerOpen}
        initialSeconds={defaultRestSeconds}
        onClose={() => setIsRestPickerOpen(false)}
        onSave={handleSaveDefaultRest}
      />

      {/* Undo Toast — positioned cleanly above the sticky action bar */}
      <UndoToast
        visible={!!lastAction}
        bottomOffset={Math.max(insets.bottom, space.md) + 84}
        message={
          lastAction?.message ||
          (lastAction?.type === 'logged' ? 'Climb logged' : 'Climb deleted')
        }
        onUndo={handleUndoAction}
        onDismiss={() => setLastAction(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: 210,
    borderWidth: 1,
    zIndex: 50,
  },
});
