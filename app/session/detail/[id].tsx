import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
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
} from 'lucide-react-native';
import { Screen } from '../../../components/ui/Screen';
import { ClimbRow } from '../../../components/ui/ClimbRow';
import { UndoToast } from '../../../components/ui/UndoToast';
import { ResultDonut } from '../../../components/ui/ResultDonut';
import { ProjectCard } from '../../../components/ui/ProjectCard';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Card } from '../../../components/ui/Card';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { LogSheet } from '../../../components/session/LogSheet';
import { useTheme } from '../../../theme/useTheme';
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
        padding: space.sm,
        alignItems: 'center',
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
        style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}
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
  const hardestLabel = hardest ? hardest.grade_raw : '–';

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
          currentGrade: hardest.grade_raw,
          prevGrade: row.grade_raw || `V${row.max_prev}`,
        };
      }
    } catch {}
    return null;
  }, [isSummary, session?.id, session?.startTime, sends.length, hardest?.grade_index]);

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
    notes: string
  ) => {
    triggerHaptic('medium');
    if (editingClimb) {
      updateClimb(editingClimb.id, {
        gradeRaw: grade,
        result,
        attempts: attemptsCount,
        notes,
      });
    } else {
      logClimbForSession(activeId, {
        gradeRaw: grade,
        result,
        attempts: attemptsCount,
        notes,
      });
    }
    setIsLogSheetOpen(false);
    setEditingClimb(null);
  };

  const subtitleText = session
    ? formatSessionSubtitle(session.startTime, session.endTime)
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
        {/* Left Side: Back chevron (only when not summary variant) */}
        {!isSummary ? (
          <TouchableOpacity
            testID="session-detail-back-btn"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}

        {/* Center / Title Block */}
        <View style={{ flex: 1, paddingHorizontal: space.sm }}>
          <Text
            style={[type.heading, { color: colors.text, fontSize: 18 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {session?.gymName || 'Session'}
          </Text>
          <Text
            style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {subtitleText}
          </Text>
        </View>

        {/* Right Side: ⋯ Menu */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            testID="session-detail-more-menu"
            onPress={() => setShowMenu(!showMenu)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MoreHorizontal size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showMenu && (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.md,
                top: insets.top + 40,
                right: space.lg,
              },
            ]}
          >
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

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.sm,
          paddingBottom: isSummary ? 140 : 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Best Highlights (Summary Variant only) */}
        {isSummary && prevBestHighlight && (
          <View
            style={{
              backgroundColor: colors.accentSoft,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
            }}
          >
            <Trophy size={22} color={colors.accentText} />
            <View style={{ flex: 1 }}>
              <Text style={[type.heading, { color: colors.accentText }]}>
                New Personal Best: {prevBestHighlight.currentGrade}!
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
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
              }}
            >
              <CheckCircle size={22} color={colors.flashText} />
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.flashText }]}>Project Sent!</Text>
                <Text style={[type.caption, { color: colors.flashText, marginTop: 1 }]}>
                  {p.title} ({p.gradeRaw})
                </Text>
              </View>
            </View>
          ))}

        {/* 1. Stat Tiles: compact row of four */}
        <View style={{ flexDirection: 'row', gap: space.xs, marginBottom: space.xl }}>
          <CompactStatTile label="Climbs" value={activeClimbs.length} />
          <CompactStatTile label="Sends" value={sends.length} />
          <CompactStatTile label="Flashes" value={flashes.length} />
          <CompactStatTile label="Hardest" value={hardestLabel} />
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
              <Text style={[type.label, { color: colors.textMuted }]}>
                {(session as any)?.effort
                  ? `EFFORT ${(session as any).effort}/5`
                  : 'SESSION NOTES'}
              </Text>
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
          <TouchableOpacity
            onPress={handleOpenEditSession}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              padding: space.md,
              backgroundColor: colors.card,
              borderRadius: radius.md,
              marginBottom: space.xl,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            accessibilityRole="button"
            accessibilityLabel="Add notes"
          >
            <Edit2 size={16} color={colors.textMuted} />
            <Text style={[type.body, { color: colors.textMuted }]}>
              Add session notes & effort
            </Text>
          </TouchableOpacity>
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
                  variant="compact"
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
              <View style={{ alignItems: 'center', paddingVertical: space.xl }}>
                <Text style={[type.body, { color: colors.textMuted }]}>
                  No climbs in this session.
                </Text>
              </View>
            )}

            {/* "+ Add climb" Button */}
            <TouchableOpacity
              testID="add-climb-btn"
              onPress={handleOpenAddClimb}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: space.md,
                backgroundColor: colors.cardMuted,
                borderRadius: radius.md,
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
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Done Button (Summary Variant only) */}
      {isSummary && (
        <View
          style={{
            position: 'absolute',
            bottom: Math.max(insets.bottom, 16),
            left: space.lg,
            right: space.lg,
          }}
        >
          <PrimaryButton
            testID="done-home-btn"
            label="Done"
            onPress={() => router.replace(lastTab as any)}
          />
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
        message="Climb deleted"
        onUndo={handleUndoDeleteClimb}
        onDismiss={() => setDeletedClimbId(null)}
      />

      {/* Undo Toast for Session Deletion */}
      <UndoToast
        visible={isSessionDeleted}
        message="Session deleted"
        onUndo={handleUndoDeleteSession}
        onDismiss={handleDismissSessionDelete}
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
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
