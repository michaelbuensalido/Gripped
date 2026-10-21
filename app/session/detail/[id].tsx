import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MoreHorizontal,
  Plus,
  Edit2,
  Trophy,
  CheckCircle,
  X,
  AlertCircle,
  Zap,
  Share2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../../components/ui/Screen';
import { ClimbRow } from '../../../components/ui/ClimbRow';
import { GradePill } from '../../../components/ui/GradePill';
import { ScalePressable } from '../../../components/ui/ScalePressable';
import { UndoToast } from '../../../components/ui/UndoToast';
import { ResultDonut } from '../../../components/ui/ResultDonut';
import { ProjectCard } from '../../../components/ui/ProjectCard';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Card } from '../../../components/ui/Card';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LogSheet } from '../../../components/session/LogSheet';
import { SessionShareCardModal } from '../../../components/session/SessionShareCardModal';
import { useTheme } from '../../../theme/useTheme';
import { usePreferences } from '../../../utils/preferences';
import {
  useSession,
  useSessionDetail,
  useSessionClimbs,
  useSessionProjects,
  useRecentSessions,
} from '../../../db/hooks';
import {
  softDeleteSession,
  undoDeleteSession,
  softDeleteBoulderLog,
  undoDeleteBoulderLog,
  logClimbForSession,
  updateClimb,
  updateSessionGym,
  updateSessionNotesAndEffort,
} from '../../../db/queries';
import { getDatabase } from '../../../db/schema';
import { useSessionStore } from '../../../store/sessionStore';
import { isSend } from '../../../utils/isSend';
import { triggerHaptic } from '../../../utils/haptics';
import { ResultType } from '../../../components/ui/ResultChip';

function formatSessionSubtitle(startedAt: number, endedAt?: number | null): string {
  const startDate = new Date(startedAt);
  const dayName = startDate.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = startDate.getDate();
  const monthName = startDate.toLocaleDateString('en-US', { month: 'short' });
  const dateStr = `${dayName} ${dayNum} ${monthName}`;

  const formatTimeOnly = (d: Date) => {
    const h = d.getHours() % 12 || 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };
  const getAmPm = (d: Date) => (d.getHours() >= 12 ? 'PM' : 'AM');

  const endDate = endedAt ? new Date(endedAt) : startDate;
  const startAmPm = getAmPm(startDate);
  const endAmPm = getAmPm(endDate);

  let timeRangeStr = '';
  if (startAmPm === endAmPm) {
    timeRangeStr = `${formatTimeOnly(startDate)}-${formatTimeOnly(endDate)} ${endAmPm}`;
  } else {
    timeRangeStr = `${formatTimeOnly(startDate)} ${startAmPm} - ${formatTimeOnly(endDate)} ${endAmPm}`;
  }

  const durationMs = Math.max(0, (endedAt || startedAt) - startedAt);
  let durationStr = '';
  if (durationMs < 60000) {
    durationStr = '<1 min';
  } else {
    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      durationStr = `${hours}h ${mins}m`;
    } else {
      durationStr = `${mins} min`;
    }
  }

  return `${dateStr} · ${timeRangeStr} · ${durationStr}`;
}

function CompactStatTile({ label, value }: { label: string; value: string | number }) {
  const { colors, type, radius, space } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 64,
        padding: space.sm,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[type.stat, { color: colors.text, fontSize: 22 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={[type.label, { color: colors.textMuted, fontSize: 10, marginTop: 2 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
}

export default function SessionDetailScreen({
  initialVariant,
}: {
  initialVariant?: 'summary';
}) {
  const params = useLocalSearchParams<{ id?: string; variant?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space, type, radius, shadow } = useTheme();
  const { formatGradeLabel } = usePreferences();
  const lastTab = useSessionStore((s) => s.lastTab);

  const isSummary = params.variant === 'summary' || initialVariant === 'summary';

  // Session resolution
  const recentSessions = useRecentSessions();
  const fallbackSession = useMemo(() => {
    return recentSessions.find((s: any) => s.endTime != null) ?? recentSessions[0] ?? null;
  }, [recentSessions]);

  const activeId = params.id || fallbackSession?.id || '';

  const session = useSession(activeId);
  const summary = useSessionDetail(activeId);
  const climbs = useSessionClimbs(activeId);
  const sessionProjects = useSessionProjects(activeId);

  // Local UI states
  const [showMenu, setShowMenu] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [deletedClimbId, setDeletedClimbId] = useState<string | null>(null);
  const [isSessionDeleted, setIsSessionDeleted] = useState(false);

  // Edit / Add climb sheet state
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [editingClimb, setEditingClimb] = useState<any | null>(null);

  // Edit Session metadata modal
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [editGymName, setEditGymName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editEffort, setEditEffort] = useState<number | null>(null);

  const activeClimbs = climbs.filter((c: any) => c.deleted_at === null);
  // Sort in ascending order (newest last, in order logged)
  const sortedClimbs = [...activeClimbs].sort((a: any, b: any) => a.logged_at - b.logged_at);

  const sends = activeClimbs.filter((c: any) => isSend(c.result));
  const flashes = activeClimbs.filter((c: any) => c.result === 'flash');
  const tops = sends.filter((c: any) => c.result !== 'flash');
  const attempts = activeClimbs.filter((c: any) => !isSend(c.result));

  const hardest = sends.reduce(
    (max: any, c: any) => (!max || c.grade_index > max.grade_index ? c : max),
    null
  );
  const hardestLabel = hardest ? formatGradeLabel(hardest.grade_raw) : '–';

  // Personal best check for summary variant: did we beat a real previous best?
  const prevBestHighlight = useMemo(() => {
    if (!isSummary || !session || sends.length === 0 || !hardest) return null;
    try {
      const db = getDatabase();
      const row = db.getFirstSync<any>(
        `
        SELECT MAX(c.grade_index) as max_prev, c.grade_raw
        FROM climbs c
        JOIN sessions s ON c.session_id = s.id
        WHERE s.id != ? 
          AND c.deleted_at IS NULL 
          AND s.deleted_at IS NULL 
          AND (c.result = 'send' OR c.result = 'top' OR c.result = 'flash')
          AND c.logged_at < ?
      `,
        [session.id, session.startTime]
      );

      if (row && row.max_prev !== null && hardest.grade_index > row.max_prev) {
        return {
          currentGrade: formatGradeLabel(hardest.grade_raw),
          prevGrade: formatGradeLabel(row.grade_raw || `V${row.max_prev}`),
        };
      }
    } catch {}
    return null;
  }, [isSummary, session?.id, session?.startTime, sends.length, hardest?.grade_index, formatGradeLabel]);

  const toppedProjects = useMemo(() => {
    return sessionProjects.filter((p: any) => p.isToppedInSession);
  }, [sessionProjects]);

  if (!session && !isSessionDeleted) {
    return (
      <Screen title="Session Detail">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[type.body, { color: colors.textMuted }]}>Session not found.</Text>
        </View>
      </Screen>
    );
  }

  const handleDeleteClimb = (climbId: string) => {
    triggerHaptic('light');
    softDeleteBoulderLog(climbId);
    setDeletedClimbId(climbId);
  };

  const handleUndoDeleteClimb = () => {
    if (deletedClimbId) {
      triggerHaptic('light');
      undoDeleteBoulderLog(deletedClimbId);
      setDeletedClimbId(null);
    }
  };

  const handleDeleteSession = () => {
    setShowMenu(false);
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this session? ${activeClimbs.length} climb(s) will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('medium');
            softDeleteSession(activeId);
            setIsSessionDeleted(true);
          },
        },
      ]
    );
  };

  const handleUndoDeleteSession = () => {
    triggerHaptic('light');
    undoDeleteSession(activeId);
    setIsSessionDeleted(false);
  };

  const handleDismissSessionDelete = () => {
    if (isSessionDeleted) {
      router.back();
    }
  };

  const handleOpenEditSession = () => {
    setShowMenu(false);
    setEditGymName(session?.gymName || '');
    setEditNotes(session?.notes || '');
    setEditEffort((session as any)?.effort ?? (session as any)?.rpe ?? null);
    setIsEditSessionModalOpen(true);
  };

  const handleSaveEditSession = () => {
    triggerHaptic('light');
    if (session) {
      if (editGymName.trim()) {
        updateSessionGym(session.id, editGymName.trim());
      }
      updateSessionNotesAndEffort(session.id, editNotes.trim(), editEffort);
    }
    setIsEditSessionModalOpen(false);
  };

  const handleOpenAddClimb = () => {
    triggerHaptic('light');
    setEditingClimb(null);
    setIsLogSheetOpen(true);
  };

  const handleEditClimb = (climb: any) => {
    triggerHaptic('light');
    setEditingClimb(climb);
    setIsLogSheetOpen(true);
  };

  const handleSaveClimb = (
    grade: string,
    result: ResultType,
    attemptsCount: number,
    notes: string,
    failureReason?: any
  ) => {
    triggerHaptic('medium');
    if (editingClimb) {
      updateClimb(editingClimb.id, {
        gradeRaw: grade,
        result,
        attempts: attemptsCount,
        notes,
        failureReason: result === 'attempt' ? (failureReason ?? null) : null,
      });
    } else {
      logClimbForSession(activeId, {
        gradeRaw: grade,
        result,
        attempts: attemptsCount,
        notes,
        failureReason: result === 'attempt' ? (failureReason ?? null) : null,
      });
    }
    setIsLogSheetOpen(false);
    setEditingClimb(null);
  };

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
        <TouchableOpacity
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
        </TouchableOpacity>
        <EmptyState
          asCard
          icon={<AlertCircle size={28} color={colors.textMuted} />}
          title="Session Not Found"
          body="This session may have been deleted or does not exist."
          cta={
            <PrimaryButton
              label="BACK TO HOME"
              onPress={() => router.replace('/')}
            />
          }
        />
      </View>
    );
  }

  const subtitleText = formatSessionSubtitle(session.startTime, session.endTime);

  return (
    <View testID="session-summary-screen" style={{ flex: 1, backgroundColor: colors.bg }}>
      {showMenu && (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
          onPress={() => setShowMenu(false)}
        />
      )}
      {/* Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, space.lg),
          paddingHorizontal: space.lg,
          paddingBottom: space.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <ScalePressable
          testID="session-detail-back-btn"
          haptic="light"
          activeScale={0.92}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
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

        {/* Center / Title Block */}
        <View style={{ flex: 1, paddingHorizontal: space.md }}>
          <Text
            style={[
              type.label,
              { color: colors.accentText, fontSize: 9, letterSpacing: 1.8, marginBottom: 1 },
            ]}
          >
            SESSION REPORT
          </Text>
          <Text
            style={[type.heading, { color: colors.text, fontSize: 18, fontWeight: '700' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {session?.gymName || 'Session'}
          </Text>
          <Text
            style={[type.caption, { color: colors.textMuted, marginTop: 1 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {subtitleText}
          </Text>
        </View>

        {/* Right Side: Share + ⋯ Menu */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ScalePressable
            testID="session-detail-share-btn"
            haptic="light"
            activeScale={0.92}
            onPress={() => setIsShareOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Share session card"
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
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
            <Share2 size={18} color={colors.accent} />
          </ScalePressable>

          <ScalePressable
            testID="session-detail-more-menu"
            haptic="light"
            activeScale={0.92}
            onPress={() => setShowMenu(!showMenu)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={{ top: 12, bottom: 12, left: 6, right: 12 }}
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
        </View>

        {/* Dropdown Menu */}
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
              onPress={() => {
                setShowMenu(false);
                setIsShareOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Share session card"
              style={{
                padding: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={[type.body, { color: colors.text, fontWeight: '600' }]}>
                Share session card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenEditSession}
              accessibilityRole="button"
              accessibilityLabel="Edit session"
              style={{
                padding: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={[type.body, { color: colors.text }]}>Edit session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteSession}
              accessibilityRole="button"
              accessibilityLabel="Delete session"
              style={{ padding: space.md }}
            >
              <Text style={[type.body, { color: colors.dangerText }]}>Delete session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Reanimated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.xs,
          paddingBottom: isSummary ? 160 : 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Best Highlights (Summary Variant only) */}
        {isSummary && prevBestHighlight && (
          <View
            style={{
              backgroundColor: colors.accentSoft,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.accent,
              padding: space.md,
              marginBottom: space.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
            }}
          >
            <Trophy size={22} color={colors.accentText} />
            <View style={{ flex: 1 }}>
              <Text style={[type.heading, { color: colors.accentText, fontWeight: '700' }]}>
                New Personal Best: {prevBestHighlight.currentGrade}
              </Text>
              <Text style={[type.caption, { color: colors.accentText, marginTop: 1 }]}>
                Beat your previous best of {prevBestHighlight.prevGrade}
              </Text>
            </View>
          </View>
        )}

        {/* Project Sent Celebrations (Summary Variant only) */}
        {isSummary &&
          toppedProjects.map((p: any) => (
            <View
              key={p.id}
              style={{
                backgroundColor: colors.flashSoft,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.flash,
                padding: space.md,
                marginBottom: space.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
              }}
            >
              <CheckCircle size={22} color={colors.flashText} />
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.flashText, fontWeight: '700' }]}>
                  Project Sent
                </Text>
                <Text style={[type.caption, { color: colors.flashText, marginTop: 1 }]}>
                  {p.title} ({p.gradeRaw})
                </Text>
              </View>
            </View>
          ))}

        {/* 1. Unified Session Telemetry Hero Card */}
        <View
          style={{
            backgroundColor: colors.materialBase,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            padding: space.lg,
            marginBottom: space.xl,
            overflow: 'hidden',
            position: 'relative',
            ...shadow.floating,
          }}
        >
          <LinearGradient
            colors={[colors.glassHighlight, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 48,
            }}
            pointerEvents="none"
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: space.md,
            }}
          >
            <Text style={[type.label, { color: colors.accentText, fontSize: 10, letterSpacing: 1.8 }]}>
              SESSION METRICS
            </Text>
            {activeClimbs.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.flashSoft,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: colors.flash,
                }}
              >
                <Text style={[type.caption, { color: colors.flashText, fontSize: 10, fontWeight: '700' }]}>
                  {Math.round((sends.length / activeClimbs.length) * 100)}% SEND RATE
                </Text>
              </View>
            )}
          </View>

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
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[type.statSm, { color: colors.text, fontSize: 22, fontWeight: '700' }]}>
                {activeClimbs.length}
              </Text>
              <Text style={[type.label, { color: colors.textMuted, fontSize: 9, marginTop: 2 }]}>
                Climbs
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[type.statSm, { color: colors.text, fontSize: 22, fontWeight: '700' }]}>
                {sends.length}
              </Text>
              <Text style={[type.label, { color: colors.textMuted, fontSize: 9, marginTop: 2 }]}>
                Sends
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  type.statSm,
                  {
                    color: flashes.length > 0 ? colors.flashText : colors.text,
                    fontSize: 22,
                    fontWeight: '700',
                  },
                ]}
              >
                {flashes.length}
              </Text>
              <Text style={[type.label, { color: colors.textMuted, fontSize: 9, marginTop: 2 }]}>
                Flashes
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            <View style={{ flex: 1, alignItems: 'center' }}>
              {hardest && hardestLabel !== '–' ? (
                <GradePill gradeIndex={hardest.grade_index ?? 0} label={hardestLabel} />
              ) : (
                <Text style={[type.statSm, { color: colors.textMuted, fontSize: 20 }]}>–</Text>
              )}
              <Text style={[type.label, { color: colors.textMuted, fontSize: 9, marginTop: 3 }]}>
                Hardest
              </Text>
            </View>
          </View>

          {activeClimbs.length > 0 && (
            <View style={{ marginTop: space.md }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  overflow: 'hidden',
                  flexDirection: 'row',
                  gap: 3,
                  backgroundColor: colors.chartGhost,
                }}
              >
                {flashes.length > 0 && (
                  <View
                    style={{
                      flex: flashes.length,
                      backgroundColor: colors.flash,
                      borderRadius: 3,
                    }}
                  />
                )}
                {tops.length > 0 && (
                  <View
                    style={{
                      flex: tops.length,
                      backgroundColor: colors.top,
                      borderRadius: 3,
                    }}
                  />
                )}
                {attempts.length > 0 && (
                  <View
                    style={{
                      flex: attempts.length,
                      backgroundColor: colors.attempt,
                      borderRadius: 3,
                      opacity: 0.75,
                    }}
                  />
                )}
              </View>
            </View>
          )}
        </View>

        {/* 2. Result Breakdown Donut (Hidden if < 3 climbs) */}
        {activeClimbs.length >= 3 && (
          <Card style={{ marginBottom: space.xl, alignItems: 'center' }}>
            <SectionHeader title="Result Breakdown" />
            <ResultDonut
              flashCount={flashes.length}
              topCount={tops.length}
              attemptCount={attempts.length}
              centerGrade={hardestLabel !== '–' ? hardestLabel : undefined}
              centerLabel="HARDEST"
            />
          </Card>
        )}

        {/* 3. Session Effort & Notes */}
        {session?.notes || (session as any)?.effort ? (
          <Card style={{ marginBottom: space.xl }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: space.xs,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text style={[type.label, { color: colors.accentText }]}>
                  {(session as any)?.effort
                    ? `EFFORT ${(session as any).effort}/5`
                    : 'SESSION NOTES'}
                </Text>
                {(session as any)?.effort ? (
                  <View style={{ flexDirection: 'row', gap: 3 }}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <View
                        key={lvl}
                        style={{
                          width: 12,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor:
                            lvl <= (session as any).effort
                              ? colors.accent
                              : colors.chartGhostStrong,
                        }}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handleOpenEditSession}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Edit notes"
              >
                <Edit2 size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {session.notes ? (
              <Text style={[type.body, { color: colors.text, marginTop: space.xs }]}>
                {session.notes}
              </Text>
            ) : null}
          </Card>
        ) : (
          <ScalePressable
            onPress={handleOpenEditSession}
            haptic="light"
            activeScale={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              padding: space.md,
              backgroundColor: colors.materialBase,
              borderRadius: radius.lg,
              marginBottom: space.xl,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
            accessibilityRole="button"
            accessibilityLabel="Add notes"
          >
            <Edit2 size={16} color={colors.accentText} />
            <Text style={[type.body, { color: colors.textMuted }]}>
              Add session notes & perceived effort
            </Text>
          </ScalePressable>
        )}

        {/* 4. Projects Section (only when relevant) */}
        {sessionProjects.length > 0 && (
          <View style={{ marginBottom: space.xl }}>
            <SectionHeader title="Projects" />
            <View style={{ gap: space.sm }}>
              {sessionProjects.map((p: any) => (
                <ProjectCard
                  key={p.id}
                  project={{
                    ...p,
                    statusChip: p.isToppedInSession ? 'Sent' : p.statusChip,
                  }}
                  disableSwipe
                />
              ))}
            </View>
          </View>
        )}

        {/* 5. Climbs List (newest last, in order logged) */}
        <View style={{ marginBottom: space.xl }}>
          <SectionHeader title="Climbs" />
          <View style={{ gap: space.sm }}>
            {sortedClimbs.map((climb: any) => (
              <ClimbRow
                key={climb.id}
                climb={climb}
                onEdit={() => handleEditClimb(climb)}
                onDelete={() => handleDeleteClimb(climb.id)}
              />
            ))}

            {activeClimbs.length === 0 && (
              <EmptyState
                asCard
                illustration={require('../../../assets/illustrations/empty-sessions.jpg')}
                icon={<Zap size={24} color={colors.accent} />}
                title="No climbs recorded"
                body="You haven't logged any climbs in this session yet."
              />
            )}

            {/* "+ Add climb" Button */}
            <ScalePressable
              testID="add-climb-btn"
              onPress={handleOpenAddClimb}
              haptic="light"
              activeScale={0.98}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: space.md,
                backgroundColor: colors.materialBase,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                marginTop: space.sm,
                gap: space.xs,
              }}
              accessibilityRole="button"
              accessibilityLabel="Add climb"
            >
              <Plus size={18} color={colors.accent} strokeWidth={2.5} />
              <Text
                style={[
                  type.heading,
                  { color: colors.accentText, fontSize: 15, fontWeight: '600' },
                ]}
              >
                Add climb
              </Text>
            </ScalePressable>
          </View>
        </View>
      </Reanimated.ScrollView>

      {/* Done & See Progress Exits (Summary Variant only — per USER_FLOW.md Section 2) */}
      {isSummary && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.materialBase,
            borderTopWidth: 1,
            borderTopColor: colors.glassBorder,
            paddingHorizontal: space.lg,
            paddingTop: space.sm,
            paddingBottom: Math.max(insets.bottom, 16),
            flexDirection: 'row',
            gap: space.sm,
            overflow: 'hidden',
            ...shadow.floating,
          }}
        >
          <LinearGradient
            colors={[colors.glassHighlight, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 32,
            }}
            pointerEvents="none"
          />
          <TouchableOpacity
            testID="see-progress-btn"
            onPress={() => {
              triggerHaptic('light');
              router.replace('/analytics');
            }}
            accessibilityRole="button"
            accessibilityLabel="See progress"
            style={{
              flex: 0.9,
              height: 52,
              borderRadius: radius.pill,
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[type.control, { color: colors.accentText, fontWeight: '700' }]}>
              See progress
            </Text>
          </TouchableOpacity>
          <View style={{ flex: 1.1 }}>
            <PrimaryButton
              testID="done-home-btn"
              label="Done"
              onPress={() => router.replace(lastTab as any)}
            />
          </View>
        </View>
      )}

      {/* Log / Edit Climb Sheet */}
      <LogSheet
        visible={isLogSheetOpen}
        onClose={() => {
          setIsLogSheetOpen(false);
          setEditingClimb(null);
        }}
        onSave={handleSaveClimb}
        initialGrade={editingClimb?.grade_raw}
        initialResult={editingClimb?.result === 'send' ? 'top' : editingClimb?.result}
        initialAttempts={editingClimb?.attempts}
        initialNotes={editingClimb?.notes}
        initialFailureReason={editingClimb?.failure_reason || null}
      />

      {/* Edit Session Modal */}
      <Modal
        visible={isEditSessionModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditSessionModalOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
          onPress={() => setIsEditSessionModalOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: space.xl,
              paddingBottom: insets.bottom + space.xl,
              ...shadow.floating,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: space.lg,
              }}
            >
              <Text style={[type.title, { color: colors.text }]}>Edit Session</Text>
              <TouchableOpacity
                onPress={() => setIsEditSessionModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <SectionHeader title="Gym Name" />
            <TextInput
              value={editGymName}
              onChangeText={setEditGymName}
              placeholder="e.g. Brooklyn Boulders"
              placeholderTextColor={colors.textMuted}
              style={[
                type.body,
                {
                  color: colors.text,
                  backgroundColor: colors.cardMuted,
                  borderRadius: radius.md,
                  padding: space.md,
                  marginBottom: space.lg,
                },
              ]}
            />

            <SectionHeader title="Perceived Effort (1–5)" />
            <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = editEffort === n;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => {
                      triggerHaptic('light');
                      setEditEffort(selected ? null : n);
                    }}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: radius.md,
                      backgroundColor: selected ? colors.accentSoft : colors.cardMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selected ? 1.5 : 0,
                      borderColor: selected ? colors.accent : 'transparent',
                    }}
                  >
                    <Text
                      style={[
                        type.heading,
                        { color: selected ? colors.accentText : colors.text },
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionHeader title="Session Notes" />
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              numberOfLines={3}
              placeholder="What went well? Any tweaks for next time?"
              placeholderTextColor={colors.textMuted}
              style={[
                type.body,
                {
                  color: colors.text,
                  backgroundColor: colors.cardMuted,
                  borderRadius: radius.md,
                  padding: space.md,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  marginBottom: space.xl,
                },
              ]}
            />

            <PrimaryButton label="Save Changes" onPress={handleSaveEditSession} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Undo Toast for Climb Deletion */}
      <UndoToast
        visible={!!deletedClimbId}
        bottomOffset={isSummary ? Math.max(insets.bottom, 16) + 76 : 40}
        message="Climb deleted"
        onUndo={handleUndoDeleteClimb}
        onDismiss={() => setDeletedClimbId(null)}
      />

      {/* Undo Toast for Session Deletion */}
      <UndoToast
        visible={isSessionDeleted}
        bottomOffset={isSummary ? Math.max(insets.bottom, 16) + 76 : 40}
        message="Session deleted"
        onUndo={handleUndoDeleteSession}
        onDismiss={handleDismissSessionDelete}
      />

      {/* Session Share Card Modal */}
      <SessionShareCardModal
        visible={isShareOpen}
        gymName={session?.gymName || 'Session'}
        subtitleText={subtitleText}
        climbsCount={activeClimbs.length}
        sendsCount={sends.length}
        flashesCount={flashes.length}
        hardestGradeRaw={hardest?.grade_raw || '–'}
        topClimbs={sends
          .slice()
          .sort((a: any, b: any) => b.grade_index - a.grade_index)
          .map((c: any) => ({ gradeRaw: c.grade_raw, result: c.result }))}
        onClose={() => setIsShareOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: 180,
    borderWidth: 1,
    zIndex: 50,
  },
});
