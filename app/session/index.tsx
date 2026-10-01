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
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession, useSessionClimbs } from '../../db/hooks';
import { useSessionStore } from '../../store/sessionStore';
import { deleteBoulderLog, softDeleteBoulderLog, undoDeleteBoulderLog } from '../../db/queries';
import { UndoToast } from '../../components/ui/UndoToast';
import { triggerHaptic } from '../../utils/haptics';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADES = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16'];

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

// ─── Grade Picker ──────────────────────────────────────────────────────────────

function GradePicker({ value, onChange }: { value: string; onChange: (g: string) => void }) {
  const { colors, type, space, radius } = useTheme();
  const idx = GRADES.indexOf(value);

  const prev = () => {
    if (idx > 0) { triggerHaptic('light'); onChange(GRADES[idx - 1]); }
  };
  const next = () => {
    if (idx < GRADES.length - 1) { triggerHaptic('light'); onChange(GRADES[idx + 1]); }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <TouchableOpacity
        onPress={prev}
        disabled={idx === 0}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.cardMuted,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: idx === 0 ? 0.3 : 1,
        }}
      >
        <ChevronLeft size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accentSoft,
        borderRadius: radius.md,
        paddingVertical: space.md,
      }}>
        <Text style={[type.stat, { color: colors.accentText }]}>{value}</Text>
      </View>

      <TouchableOpacity
        onPress={next}
        disabled={idx === GRADES.length - 1}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.cardMuted,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: idx === GRADES.length - 1 ? 0.3 : 1,
        }}
      >
        <ChevronRight size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Result Selector ──────────────────────────────────────────────────────────

function ResultSelector({ value, onChange }: { value: ResultType; onChange: (r: ResultType) => void }) {
  const { colors, space, radius, type } = useTheme();

  const options: { result: ResultType; label: string; color: string; bg: string; testID?: string }[] = [
    { result: 'flash', label: 'Flash', color: colors.flashText, bg: colors.flashSoft },
    { result: 'top',   label: 'Top',   color: colors.topText,   bg: colors.topSoft },
    { result: 'attempt', label: 'Attempt', color: colors.attemptText, bg: colors.attemptSoft, testID: 'log-attempt-chip' },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      {options.map((o) => {
        const selected = value === o.result;
        return (
          <TouchableOpacity
            testID={(o as any).testID}
            key={o.result}
            onPress={() => { triggerHaptic('light'); onChange(o.result); }}
            style={{
              flex: 1,
              paddingVertical: space.lg,
              borderRadius: radius.md,
              backgroundColor: selected ? o.bg : colors.cardMuted,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: selected ? 1.5 : 0,
              borderColor: selected ? o.color : 'transparent',
            }}
          >
            <Text style={[type.heading, { color: selected ? o.color : colors.textMuted }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Attempts Stepper ─────────────────────────────────────────────────────────

function AttemptsStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { colors, space, radius, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <TouchableOpacity
        onPress={() => { if (value > 1) { triggerHaptic('light'); onChange(value - 1); } }}
        style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: colors.cardMuted, alignItems: 'center', justifyContent: 'center',
          opacity: value <= 1 ? 0.3 : 1,
        }}
      >
        <Minus size={18} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[type.stat, { color: colors.text }]}>{value}</Text>
      </View>
      <TouchableOpacity
        onPress={() => { triggerHaptic('light'); onChange(value + 1); }}
        style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: colors.cardMuted, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Plus size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Log Sheet ─────────────────────────────────────────────────────────────────

function LogSheet({
  visible,
  onClose,
  onSave,
  initialGrade,
  initialResult,
  initialAttempts,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (grade: string, result: ResultType, attempts: number, notes: string) => void;
  initialGrade?: string;
  initialResult?: ResultType;
  initialAttempts?: number;
}) {
  const { colors, space, type, radius, shadow } = useTheme();
  const [grade, setGrade] = useState(initialGrade ?? 'V4');
  const [result, setResult] = useState<ResultType>(initialResult ?? 'top');
  const [attempts, setAttempts] = useState(initialAttempts ?? 1);
  const [notes, setNotes] = useState('');

  // Reset when sheet opens with new initial values
  useEffect(() => {
    if (visible) {
      setGrade(initialGrade ?? 'V4');
      setResult(initialResult ?? 'top');
      setAttempts(initialAttempts ?? 1);
      setNotes('');
    }
  }, [visible, initialGrade, initialResult, initialAttempts]);

  // Auto-set attempts based on result
  useEffect(() => {
    if (result === 'flash') setAttempts(1);
  }, [result]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: space.xl,
              paddingBottom: space.xxl + 20,
              ...shadow.floating,
            }}
          >
            {/* Handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: 'center',
              marginBottom: space.lg,
            }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
              <Text style={[type.title, { color: colors.text }]}>Log Climb</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Result */}
            <SectionHeader title="Result" />
            <View style={{ marginBottom: space.lg }}>
              <ResultSelector value={result} onChange={setResult} />
            </View>

            {/* Grade */}
            <SectionHeader title="Grade" />
            <View style={{ marginBottom: space.lg }}>
              <GradePicker value={grade} onChange={setGrade} />
            </View>

            {/* Attempts — hidden for Flash */}
            {result !== 'flash' && (
              <>
                <SectionHeader title="Attempts" />
                <View style={{ marginBottom: space.lg }}>
                  <AttemptsStepper value={attempts} onChange={setAttempts} />
                </View>
              </>
            )}

            {/* Notes (optional) */}
            <SectionHeader title="Notes (optional)" />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Beta, holds, feeling…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              style={[
                type.body,
                {
                  color: colors.text,
                  backgroundColor: colors.cardMuted,
                  borderRadius: radius.md,
                  padding: space.md,
                  marginBottom: space.xl,
                  minHeight: 64,
                  textAlignVertical: 'top',
                },
              ]}
            />

            <PrimaryButton
              label="SAVE CLIMB"
              onPress={() => onSave(grade, result, result === 'flash' ? 1 : attempts, notes)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
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
      <Screen title="No Session" scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
          <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
            No active session.
          </Text>
          <PrimaryButton testID="start-session-btn" label="Start New Session" onPress={() => router.replace('/session/new')} />
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
