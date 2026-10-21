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
import { LinearGradient } from 'expo-linear-gradient';
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
import { GradePill } from '../../components/ui/GradePill';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LogSheet } from '../../components/session/LogSheet';
import { StartSessionSheet } from '../../components/session/StartSessionSheet';
import {
  RestTimerPickerSheet,
  formatRestDuration,
} from '../../components/session/RestTimerPickerSheet';
import { UndoToast } from '../../components/ui/UndoToast';
import { ScalePressable } from '../../components/ui/ScalePressable';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTheme } from '../../theme/useTheme';
import { usePreferences } from '../../utils/preferences';
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
  getHistoricalHardestGradeIndex,
  updateSessionGym,
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

const LiveTimer = React.memo(
  ({ startTime, textStyle }: { startTime: number; textStyle: any }) => {
    const [elapsed, setElapsed] = useState(Date.now() - startTime);

    useEffect(() => {
      const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
      return () => clearInterval(interval);
    }, [startTime]);

    return <Text style={textStyle}>{formatActiveDuration(elapsed)}</Text>;
  }
);
LiveTimer.displayName = 'LiveTimer';

// Optical Glass Sticky Bottom Action Dock with Rest Progress Bar + LOG CLIMB CTA
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
  const totalRestMs = Math.max(1000, defaultRestSeconds * 1000);
  const restProgress = isRestComplete
    ? 1
    : Math.min(1, Math.max(0, 1 - restRemaining / totalRestMs));

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.materialBase,
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: Math.max(insets.bottom, space.md),
        gap: space.sm,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
        overflow: 'hidden',
        ...shadow.floating,
      }}
    >
      {/* Top Specular Glass Sheen */}
      <LinearGradient
        colors={[colors.glassHighlight, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 36,
        }}
        pointerEvents="none"
      />

      {/* Live Rest Progress Bar along top edge when resting */}
      {hasActiveRest && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: colors.chartGhost,
          }}
        >
          <View
            style={{
              width: `${Math.round(restProgress * 100)}%`,
              height: '100%',
              backgroundColor: isRestComplete ? colors.flash : colors.accent,
            }}
          />
        </View>
      )}

      {/* 1-Handed Rest Timer Quick Actions when resting or complete */}
      {hasActiveRest && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: space.xs,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isRestComplete ? colors.flash : colors.accent,
              }}
            />
            <Text
              style={[
                type.caption,
                {
                  color: isRestComplete ? colors.flashText : colors.accentText,
                  fontWeight: '700',
                },
              ]}
            >
              {isRestComplete
                ? 'Rest complete — ready for next burn'
                : isRestRunning
                ? `Resting · ${formatRestRemaining(restRemaining)} left`
                : `Rest paused · ${formatRestRemaining(restRemaining)} left`}
            </Text>
          </View>

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
                  borderColor: colors.glassBorder,
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
              <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>
                Reset
              </Text>
            </ScalePressable>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        {/* Secondary REST Toggle Capsule */}
        <ScalePressable
          onPress={onToggleRest}
          onLongPress={onOpenRestPicker}
          haptic="light"
          activeScale={0.96}
          accessibilityRole="button"
          accessibilityLabel="Rest Timer"
          style={{
            flex: 0.85,
            height: 54,
            minHeight: 54,
            borderRadius: radius.pill,
            backgroundColor: isRestComplete
              ? colors.flashSoft
              : isRestRunning
              ? colors.accentSoft
              : colors.cardMuted,
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
              : colors.glassBorder,
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
                  fontSize: 9,
                  letterSpacing: 1.2,
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
                  fontSize: 15,
                  fontWeight: '700',
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

        {/* Primary + LOG CLIMB CTA */}
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
  const { colors, space, type, radius, shadow, gradeBand } = useTheme();
  const { formatGradeLabel } = usePreferences();
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
  const [isSwitchGymOpen, setIsSwitchGymOpen] = useState(false);
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

  const activeClimbs = useMemo(
    () => climbs.filter((c: any) => c.deleted_at === null),
    [climbs]
  );

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

  const sendRate =
    activeClimbs.length > 0 ? Math.round((sends.length / activeClimbs.length) * 100) : 0;

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

  useEffect(() => {
    try {
      const { liveActivityManager } = require('../../services/liveActivity');
      liveActivityManager.syncFromDatabase();
    } catch {}
  }, [session?.id, session?.gymName, activeClimbs.length, sends.length]);

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
      setRestTimer(Date.now() + restRemaining, false);
    } else {
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
      const histHardest = getHistoricalHardestGradeIndex(session?.id);
      setGlobalHardest(histHardest);

      const sessionRow = db.getFirstSync<any>(
        'SELECT count(*) as c FROM sessions WHERE ended_at IS NOT NULL AND deleted_at IS NULL AND id != ?',
        [session?.id || '']
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
            gradeRaw: formatGradeLabel(proj?.gradeRaw || c.grade_raw),
            burns: proj?.attempts || proj?.burns || 1,
            sessions: proj?.sessions || 1,
          });
          markCelebrated(c.id, 'big');
        } else if (
          isSend(c.result) &&
          shouldFireMediumCelebration(c.grade_index, globalHardest, totalSessionsCount)
        ) {
          triggerMedium(`New hardest: ${formatGradeLabel(c.grade_index, c.grade_raw)}`);
          markCelebrated(c.id, 'medium');
          setGlobalHardest(Math.max(globalHardest ?? 0, c.grade_index));
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 400,
              delay: 600,
              useNativeDriver: false,
            }),
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
    formatGradeLabel,
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
          illustration={require('../../assets/illustrations/empty-sessions.jpg')}
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
    selectedProj?: any | null,
    wallAngle?: string | null,
    holdType?: string | null
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
        wallAngle: selectedProj ? selectedProj.wallAngle : (wallAngle ?? null),
        holdType: selectedProj ? selectedProj.holdType : (holdType ?? null),
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
      wallAngle: targetProject ? targetProject.wallAngle : (wallAngle || undefined),
      holdType: targetProject ? targetProject.holdType : (holdType || undefined),
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
      wallAngle: climb.wall_angle || null,
      holdType: climb.hold_type || null,
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
  const quickGrades: string[] =
    recentGrades.length > 0
      ? recentGrades.map((r: any) => (typeof r === 'string' ? r : r.gradeRaw))
      : ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8'];

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
          paddingBottom: space.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
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

        {/* Center: Live Gym Title */}
        <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 1 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.flash,
              }}
            />
            <Text style={[type.label, { color: colors.flashText, fontSize: 9, letterSpacing: 1.8 }]}>
              LIVE SESSION
            </Text>
          </View>
          <Text
            style={[type.heading, { color: colors.text, fontSize: 17, fontWeight: '700' }]}
            numberOfLines={1}
          >
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
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[type.heading, { color: colors.accentText, fontSize: 14, fontWeight: '700' }]}>
              End
            </Text>
          </ScalePressable>
        </View>

        {/* Dropdown Menu Overlay */}
        {showMenu && (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.materialBase,
                borderColor: colors.glassBorder,
                borderRadius: radius.md,
                top: insets.top + 52,
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
                setIsSwitchGymOpen(true);
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
          paddingTop: space.xs,
          paddingBottom: 195,
          gap: space.lg,
        }}
      >
        {/* 1. Hero Component: Chronograph Telemetry Deck */}
        <View
          style={{
            backgroundColor: colors.materialBase,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            padding: space.lg,
            overflow: 'hidden',
            position: 'relative',
            ...shadow.floating,
          }}
        >
          <LinearGradient
            colors={[colors.accentSoft, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 90,
            }}
            pointerEvents="none"
          />

          {/* Top Bar inside Hero Deck: Live Status Pill + Rest Config Pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: space.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.flashSoft,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.flash,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.flash,
                }}
              />
              <Text style={[type.label, { color: colors.flashText, fontSize: 9, letterSpacing: 1.5 }]}>
                LIVE TELEMETRY
              </Text>
            </View>

            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                setIsRestPickerOpen(true);
              }}
              haptic="light"
              activeScale={0.95}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: colors.cardMuted,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <SlidersHorizontal size={11} color={colors.accentText} />
              <Text style={[type.caption, { color: colors.textWhiteSecondary, fontSize: 11, fontWeight: '600' }]}>
                Rest: {formatRestDuration(defaultRestSeconds)}
              </Text>
            </ScalePressable>
          </View>

          {/* Centerpiece Live Elapsed Clock */}
          <View style={{ alignItems: 'center', paddingVertical: space.sm }}>
            <LiveTimer
              startTime={session.startTime}
              textStyle={[
                type.stat,
                {
                  color: colors.textWhitePrimary,
                  fontSize: 48,
                  lineHeight: 54,
                  letterSpacing: -1,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                },
              ]}
            />
            <Text
              style={[
                type.label,
                { color: colors.textMuted, fontSize: 9, letterSpacing: 2.2, marginTop: 2 },
              ]}
            >
              ELAPSED WALL TIME
            </Text>
          </View>

          {/* Integrated 4-Column Telemetry Bento Strip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.cardMuted,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: space.md,
              paddingHorizontal: space.sm,
              marginTop: space.md,
            }}
          >
            {/* Volume */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  type.statSm,
                  { color: colors.textWhitePrimary, fontSize: 22, fontWeight: '700' },
                ]}
              >
                {activeClimbs.length}
              </Text>
              <Text
                style={[
                  type.label,
                  { color: colors.textMuted, fontSize: 9, letterSpacing: 1.2, marginTop: 2 },
                ]}
              >
                VOLUME
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            {/* Send Rate */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  type.statSm,
                  { color: colors.textWhitePrimary, fontSize: 22, fontWeight: '700' },
                ]}
              >
                {sendRate}%
              </Text>
              <Text
                style={[
                  type.label,
                  { color: colors.textMuted, fontSize: 9, letterSpacing: 1.2, marginTop: 2 },
                ]}
              >
                {sends.length} SENT
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            {/* Flashes */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  type.statSm,
                  {
                    color: flashes.length > 0 ? colors.flashText : colors.textWhitePrimary,
                    fontSize: 22,
                    fontWeight: '700',
                  },
                ]}
              >
                {flashes.length}
              </Text>
              <Text
                style={[
                  type.label,
                  { color: colors.textMuted, fontSize: 9, letterSpacing: 1.2, marginTop: 2 },
                ]}
              >
                FLASHES
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            {/* Hardest */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              {sends.length > 0 && hardestLabel !== '–' ? (
                <GradePill gradeIndex={hardestIndex} label={hardestLabel} />
              ) : (
                <Text
                  style={[
                    type.statSm,
                    { color: colors.textMuted, fontSize: 20, fontWeight: '700' },
                  ]}
                >
                  –
                </Text>
              )}
              <Text
                style={[
                  type.label,
                  { color: colors.textMuted, fontSize: 9, letterSpacing: 1.2, marginTop: 3 },
                ]}
              >
                HARDEST
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Signature Grade-Band Quick Log Strip */}
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={[
                type.label,
                {
                  color: colors.textMuted,
                  letterSpacing: 1.8,
                  fontSize: 10,
                },
              ]}
            >
              1-TAP GRADE LOG
            </Text>
            <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]}>
              Tap grade to log climb
            </Text>
          </View>
          <Reanimated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -space.lg }}
            contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.xs }}
          >
            {quickGrades.map((g: string) => {
              const gNum = parseInt(String(g).replace(/[^0-9]/g, ''), 10);
              const gBand = gradeBand(isNaN(gNum) ? 0 : gNum);
              const displayGrade = formatGradeLabel(g);
              return (
                <ScalePressable
                  key={g}
                  onPress={() => {
                    triggerHaptic('selection');
                    setEditingClimb(null);
                    setSelectedQuickGrade(g);
                    setLogSheetOpen(true);
                  }}
                  haptic="selection"
                  activeScale={0.94}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick log ${displayGrade}`}
                  style={{
                    height: 42,
                    minWidth: 58,
                    paddingHorizontal: 14,
                    borderRadius: radius.pill,
                    backgroundColor: colors.materialBase,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: gBand.solid,
                    }}
                  />
                  <Text
                    style={[
                      type.heading,
                      { color: colors.text, fontSize: 14, fontWeight: '700' },
                    ]}
                  >
                    {displayGrade}
                  </Text>
                </ScalePressable>
              );
            })}
          </Reanimated.ScrollView>
        </View>

        {/* 3. Non-blocking "Make this a project?" prompt after logging an Attempt */}
        {projectCandidate && (
          <Reanimated.View
            entering={FadeInDown.duration(180)}
            exiting={FadeOutUp.duration(150)}
            style={{
              backgroundColor: colors.materialBase,
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
                  Working on this {formatGradeLabel(projectCandidate.gradeRaw)}?
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
                <Text
                  style={[
                    type.control,
                    { color: colors.textOnAccent, fontWeight: '700', fontSize: 13 },
                  ]}
                >
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

        {/* 4. Fast Repeat / +1 Attempt Quick Action */}
        {lastClimb && (
          <ScalePressable
            onPress={() => {
              const attemptId = logGenericAscent({
                gradeRaw: lastClimb.grade_raw,
                outcome: 'attempt',
                movesLinked: 1,
                notes: '',
                projectId: lastClimb.project_id || undefined,
                wallAngle: lastClimb.wall_angle || undefined,
                holdType: lastClimb.hold_type || undefined,
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
              backgroundColor: colors.materialBase,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.md,
              gap: space.sm,
            }}
          >
            <Plus size={18} color={colors.attemptText} />
            <Text style={[type.heading, { color: colors.text, fontSize: 15, fontWeight: '600' }]}>
              +1 Attempt on{' '}
              {lastClimb.projectTitle
                ? `${lastClimb.projectTitle} (${formatGradeLabel(lastClimb.grade_raw)})`
                : formatGradeLabel(lastClimb.grade_raw)}
            </Text>
          </ScalePressable>
        )}

        {/* 5. Active Projects Strip */}
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
                  <View key={p.id} style={{ width: 260 }}>
                    <ProjectCard
                      project={p}
                      onLogAttempt={() => {
                        const attemptId = logGenericAscent({
                          projectId: p.id,
                          gradeRaw: p.gradeRaw ?? p.grade_raw,
                          outcome: 'attempt',
                          movesLinked: 1,
                          notes: '',
                          wallAngle: p.wallAngle || undefined,
                          holdType: p.holdType || undefined,
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

        {/* 6. Session Insights */}
        {activeClimbs.length > 0 && <SessionInsights climbs={activeClimbs} />}

        {/* 7. Climbs Stream */}
        <View testID="climb-list" style={{ gap: space.sm }}>
          <SectionHeader
            title={
              activeClimbs.length > 0
                ? `Climb Stream (${activeClimbs.length})`
                : 'Climb Stream'
            }
          />

          {[...activeClimbs]
            .sort((a: any, b: any) => b.logged_at - a.logged_at)
            .map((climb: any) => (
              <ClimbRow
                key={climb.id}
                climb={climb}
                onEdit={handleEditClimb}
                onDelete={handleDeleteClimb}
                animateEntry={Date.now() - climb.logged_at < 5000}
                isNewFlash={
                  climb.result === 'flash' && Date.now() - climb.logged_at < 5000
                }
              />
            ))}

          {activeClimbs.length === 0 && (
            <EmptyState
              asCard
              illustration={require('../../assets/illustrations/empty-sessions.jpg')}
              icon={<Zap size={24} color={colors.accent} />}
              title="Ready to send?"
              body="Tap a quick grade above or + LOG CLIMB below to record your first climb."
            />
          )}
        </View>
      </Reanimated.ScrollView>

      {/* Optical Glass Sticky Bottom Action Dock */}
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
        initialGrade={
          editingClimb?.grade ||
          selectedQuickGrade ||
          activeProjectTarget?.gradeRaw ||
          (activeClimbs.length > 0
            ? activeClimbs[activeClimbs.length - 1].grade_raw
            : undefined)
        }
        initialResult={editingClimb?.result || (activeProjectTarget ? 'attempt' : undefined)}
        initialAttempts={editingClimb?.attempts}
        initialNotes={editingClimb?.notes}
        initialFailureReason={editingClimb?.failureReason}
        initialWallAngle={editingClimb?.wallAngle}
        initialHoldType={editingClimb?.holdType}
        selectedProject={
          editingClimb?.projectId
            ? allProjects.find((p: any) => p.id === editingClimb.projectId)
            : activeProjectTarget
        }
        onSelectProject={(proj) => setActiveProjectTarget(proj)}
        projects={activeProjects}
      />

      {/* In-Session Gym Switcher Sheet */}
      <StartSessionSheet
        visible={isSwitchGymOpen}
        onClose={() => setIsSwitchGymOpen(false)}
        title="Switch Gym"
        subtitle="Update the gym for your active session."
        ctaLabel="Update gym"
        onStart={(newGym) => {
          triggerHaptic('success');
          updateSessionGym(session.id, newGym);
          setIsSwitchGymOpen(false);
        }}
      />

      {/* Rest Timer Duration Picker Sheet */}
      <RestTimerPickerSheet
        visible={isRestPickerOpen}
        initialSeconds={defaultRestSeconds}
        onSave={handleSaveDefaultRest}
        onClose={() => setIsRestPickerOpen(false)}
      />

      {/* Undo Toast */}
      <UndoToast
        visible={!!lastAction}
        bottomOffset={hasActiveRest(isRestTimerRunning, restRemaining, isRestComplete) ? 128 : 96}
        message={
          lastAction?.message ||
          (lastAction?.type === 'logged' ? 'Climb logged' : 'Climb deleted')
        }
        onUndo={lastAction?.type === 'project_created' ? undefined : handleUndoAction}
        onDismiss={() => setLastAction(null)}
      />
    </View>
  );
}

function hasActiveRest(
  isRunning: boolean,
  remaining: number,
  isComplete: boolean
): boolean {
  return isRunning || remaining > 0 || isComplete;
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: 190,
    borderWidth: 1,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
});
