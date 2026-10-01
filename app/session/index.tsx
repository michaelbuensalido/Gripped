import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X, Minus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { StatTile } from '../../components/ui/StatTile';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { GradePill } from '../../components/ui/GradePill';
import { ResultChip, ResultType } from '../../components/ui/ResultChip';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession, useSessionClimbs } from '../../db/hooks';
import { useSessionStore } from '../../store/sessionStore';
import { deleteBoulderLog, softDeleteBoulderLog, undoDeleteBoulderLog } from '../../db/queries';
import { UndoToast } from '../../components/ui/UndoToast';
import { LogSheet } from '../../components/session/LogSheet';
import { triggerHaptic } from '../../utils/haptics';

// ─── Constants ────────────────────────────────────────────────────────────────


function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function gradeToIndex(g: string) {
  return parseInt(g.replace('V', ''), 10) || 0;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { colors, space, type, radius } = useTheme();

  const session = useActiveSession();
  const climbs = useSessionClimbs(session?.id ?? '');
  const { isLogSheetOpen, setLogSheetOpen, logGenericAscent } = useSessionStore();

  const [elapsed, setElapsed] = useState(0);
  const [projectPromptAttemptId, setProjectPromptAttemptId] = useState<string | null>(null);
  const [deletedClimbId, setDeletedClimbId] = useState<string | null>(null);
  const [editingClimb, setEditingClimb] = useState<{ grade: string; result: ResultType; attempts: number } | null>(null);

  // Live timer
  useEffect(() => {
    if (!session) return;
    const start = session.startTime;
    setElapsed(Date.now() - start);
    const interval = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, [session?.id]);

  // No active session guard
  if (!session) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={<Plus size={24} color={colors.textMuted} />}
            title="No active session"
            body="Start a session to log your climbs and track progress."
            cta={<PrimaryButton testID="start-session-btn" label="Start New Session" onPress={() => router.replace('/')} />}
          />
        </View>
      </Screen>
    );
  }

  // Stats
  const sends = climbs.filter(
    (c: any) => c.result === 'send' || c.result === 'top' || c.result === 'flash'
  );
  const flashes = climbs.filter((c: any) => c.result === 'flash');
  const hardest = sends.reduce((max: number, c: any) =>
    Math.max(max, c.grade_index ?? 0), 0);
  const hardestLabel = sends.length > 0 ? `V${hardest}` : '–';

  const handleSaveLog = (grade: string, result: ResultType, attempts: number, notes: string) => {
    triggerHaptic('medium');
    const attemptId = logGenericAscent({
      gradeRaw: grade,
      outcome: result === 'top' ? 'send' : result,
      movesLinked: attempts,
      notes,
    });
    setLogSheetOpen(false);
    setEditingClimb(null);
    if (result === 'attempt') {
      setProjectPromptAttemptId(attemptId);
    }
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

  const handleEditClimb = (climb: any) => {
    // Delete existing entry and re-open sheet pre-filled
    deleteBoulderLog(climb.id);
    setEditingClimb({
      grade: climb.grade_raw,
      result: (climb.result === 'send' ? 'top' : climb.result) as ResultType,
      attempts: climb.attempts ?? 1,
    });
    setLogSheetOpen(true);
  };

  return (
    <>
      <Screen
        title={session.gymName || 'Session'}
        subtitle={formatDuration(elapsed)}
        scroll
        headerRight={
          <SecondaryButton
            label="End"
            onPress={() => router.push('/session/end')}
          />
        }
      >
        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
          <StatTile label="Sends" value={sends.length} flex />
          <StatTile label="Flashes" value={flashes.length} flex />
          <StatTile label="Hardest" value={hardestLabel} flex />
        </View>

        {/* Climb list */}
                {/* Project Prompt */}
        {projectPromptAttemptId && (
          <View style={{ backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: space.md, marginBottom: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[type.body, { color: colors.accentText }]}>Make this a project?</Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <TouchableOpacity onPress={() => setProjectPromptAttemptId(null)} style={{ padding: space.sm }}>
                <Text style={[type.caption, { color: colors.accentText }]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="make-project-btn" onPress={() => {
                triggerHaptic('light');
                const climb = climbs.find((c: any) => c.id === projectPromptAttemptId);
                if (climb) {
                  useSessionStore.getState().createProject({
                    title: `Project ${climb.grade_raw}`,
                    gradeRaw: climb.grade_raw,
                    gradeIndex: climb.grade_index,
                  });
                }
                setProjectPromptAttemptId(null);
                router.push('/projects');
              }} style={{ paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: colors.accent, borderRadius: radius.sm }}>
                <Text style={[type.caption, { color: colors.textOnAccent, fontWeight: '700' }]}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <SectionHeader title={`Climbs (${climbs.length})`} />
        <View testID="climb-list" style={{ gap: space.sm, marginBottom: 120 }}>
          {climbs.map((climb: any) => {
            const resultKey: ResultType =
              climb.result === 'send' ? 'top' : (climb.result as ResultType) ?? 'attempt';
            return (
              <View
                key={climb.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: space.md,
                  paddingVertical: space.sm,
                  gap: space.md,
                }}
              >
                {/* Tap row = edit */}
                <TouchableOpacity
                  onPress={() => handleEditClimb(climb)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}
                  activeOpacity={0.7}
                >
                  <GradePill gradeIndex={climb.grade_index ?? 0} label={climb.grade_raw} />
                  <ResultChip result={resultKey} />
                  {climb.attempts > 1 && (
                    <Text style={[type.caption, { color: colors.textMuted }]}>
                      ×{climb.attempts}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => handleDeleteClimb(climb.id)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })}

          {climbs.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: space.xxl }}>
              <Text style={[type.body, { color: colors.textMuted }]}>
                No climbs yet. Tap + to log your first one.
              </Text>
            </View>
          )}
        </View>
      </Screen>

      {/* Floating Log Button — outside Screen scroll */}
      <View
        style={{
          position: 'absolute',
          bottom: 100,
          left: space.xl,
          right: space.xl,
        }}
        pointerEvents="box-none"
      >
        <PrimaryButton
          icon={<Plus color={colors.textOnAccent} size={20} strokeWidth={2.5} />}
          label="LOG CLIMB"
          onPress={() => {
            setEditingClimb(null);
            setLogSheetOpen(true);
          }}
        />
      </View>

      {/* Log Sheet */}
      <LogSheet
        visible={isLogSheetOpen}
        onClose={() => { setLogSheetOpen(false); setEditingClimb(null); }}
        onSave={handleSaveLog}
        initialGrade={editingClimb?.grade}
        initialResult={editingClimb?.result}
        initialAttempts={editingClimb?.attempts}
      />
      <UndoToast visible={!!deletedClimbId} onUndo={handleUndoDelete} onDismiss={() => setDeletedClimbId(null)} />
    </>
  );
}
