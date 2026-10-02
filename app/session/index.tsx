import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, MoreHorizontal } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ClimbRow } from '../../components/ui/ClimbRow';
import { GradePill } from '../../components/ui/GradePill';
import { SyncChip } from '../../components/ui/SyncChip';
import { LogSheet } from '../../components/session/LogSheet';
import { UndoToast } from '../../components/ui/UndoToast';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession, useSessionClimbs, useRecentGrades } from '../../db/hooks';
import { useSessionStore } from '../../store/sessionStore';
import { deleteSession, softDeleteBoulderLog, undoDeleteBoulderLog } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';
import { ResultType } from '../../components/ui/ResultChip';

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 60) return '<1 min';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function LiveTimer({ startTime, textStyle }: { startTime: number, textStyle: any }) {
  const [elapsed, setElapsed] = useState(Date.now() - startTime);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <Text style={textStyle}>{formatDuration(elapsed)}</Text>;
}

function CompactStatTile({ label, value }: { label: string, value: string | number }) {
  const { colors, type, radius, space } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: space.sm, alignItems: 'center' }}>
      <Text style={[type.stat, { color: colors.text, fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
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
  
  const { logGenericAscent, setActiveSessionId } = useSessionStore();

  const [isLogSheetOpen, setLogSheetOpen] = useState(false);
  const [editingClimb, setEditingClimb] = useState<any>(null);
  const [deletedClimbId, setDeletedClimbId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Filter out soft-deleted climbs from UI display
  const activeClimbs = climbs.filter((c: any) => c.deleted_at === null);

  if (!session) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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

  const sends = activeClimbs.filter(
    (c: any) => c.result === 'send' || c.result === 'top' || c.result === 'flash'
  );
  const flashes = activeClimbs.filter((c: any) => c.result === 'flash');
  const hardest = sends.reduce((max: number, c: any) =>
    Math.max(max, c.grade_index ?? 0), 0);
  const hardestLabel = sends.length > 0 ? `V${hardest}` : '–';

  const handleQuickAdd = (grade: { gradeRaw: string, gradeIndex: number }) => {
    triggerHaptic('light');
    const attemptId = logGenericAscent({
      gradeRaw: grade.gradeRaw,
      outcome: 'top',
      movesLinked: 1,
      notes: '',
    });
    setDeletedClimbId(attemptId);
  };

  const handleQuickAddUndo = () => {
    if (deletedClimbId) {
      triggerHaptic('light');
      softDeleteBoulderLog(deletedClimbId); // undoing a quick add means deleting it
      setDeletedClimbId(null);
    }
  };

  const handleSaveLog = (grade: string, result: ResultType, attempts: number, notes: string) => {
    triggerHaptic('medium');
    logGenericAscent({
      gradeRaw: grade,
      outcome: result === 'top' ? 'send' : result,
      movesLinked: attempts,
      notes,
    });
    setLogSheetOpen(false);
    setEditingClimb(null);
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
          }
        }
      ]
    );
  };

  const handleEditClimb = (climb: any) => {
    softDeleteBoulderLog(climb.id);
    setEditingClimb({
      grade: climb.grade_raw,
      result: (climb.result === 'send' ? 'top' : climb.result) as ResultType,
      attempts: climb.attempts ?? 1,
    });
    setLogSheetOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Custom Header */}
      <View style={{
        paddingTop: Math.max(insets.top, space.lg),
        paddingHorizontal: space.lg,
        paddingBottom: space.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        {/* Left Side (Chevron) */}
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Center Title Block - Absolute positioned to guarantee true center */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: Math.max(insets.top, space.lg) - 4, alignItems: 'center', pointerEvents: 'none' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: 2 }}>
            <Text style={[type.heading, { color: colors.text, fontSize: 16 }]} numberOfLines={1}>
              {session.gymName || 'Session'}
            </Text>
            <SyncChip state="synced" />
          </View>
          <LiveTimer startTime={session.startTime} textStyle={[type.stat, { color: colors.text, fontSize: 32 }]} />
        </View>

        {/* Right Side (More Options + End) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <TouchableOpacity 
            onPress={() => setShowMenu(!showMenu)} 
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreHorizontal size={24} color={colors.text} />
          </TouchableOpacity>
          <SecondaryButton
            label="End"
            onPress={() => router.push('/session/end')}
          />
        </View>
        
        {/* Dropdown Menu Overlay */}
        {showMenu && (
          <View style={[
            styles.menu, 
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, top: insets.top + 40, right: space.lg }
          ]}>
            <TouchableOpacity style={{ padding: space.md, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => setShowMenu(false)}>
              <Text style={[type.body, { color: colors.text }]}>Change gym</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDiscardSession} style={{ padding: space.md }}>
              <Text style={[type.body, { color: colors.dangerText }]}>Discard session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 160 }}>
        {/* Compact Stat Tiles */}
        <View style={{ flexDirection: 'row', gap: space.xs, marginBottom: space.xl, marginTop: space.sm }}>
          <CompactStatTile label="Climbs" value={activeClimbs.length} />
          <CompactStatTile label="Sends" value={sends.length} />
          <CompactStatTile label="Flashes" value={flashes.length} />
          <CompactStatTile label="Hardest" value={hardestLabel} />
        </View>

        {/* Quick Add Row */}
        <View style={{ marginBottom: space.lg }}>
          <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 1 }]}>
            Tap a grade to log a Top. Hold for more options.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, gap: space.sm }}>
              {recentGrades.map((g) => (
                <TouchableOpacity
                  key={g.gradeRaw}
                  onPress={() => handleQuickAdd(g)}
                  onLongPress={() => {
                    setEditingClimb({ grade: g.gradeRaw, result: 'top', attempts: 1 });
                    setLogSheetOpen(true);
                  }}
                  delayLongPress={400}
                >
                  <GradePill gradeIndex={g.gradeIndex} label={g.gradeRaw} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Climb List */}
        <View style={{ gap: space.sm }}>
          {activeClimbs.map((climb: any) => (
            <ClimbRow 
              key={climb.id} 
              climb={climb} 
              onEdit={handleEditClimb} 
              onDelete={handleDeleteClimb} 
            />
          ))}
          
          {activeClimbs.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: space.xl }}>
              <Text style={[type.body, { color: colors.textMuted }]}>
                Tap a grade to log your first climb
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Log Climb Button */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16),
          left: space.lg,
          right: space.lg,
        }}
      >
        <PrimaryButton
          testID="log-climb-btn"
          icon={<Plus color={colors.textOnAccent} size={20} strokeWidth={2.5} />}
          label="LOG CLIMB"
          onPress={() => {
            setEditingClimb(null);
            setLogSheetOpen(true);
          }}
        />
      </View>

      <LogSheet
        visible={isLogSheetOpen}
        onClose={() => { setLogSheetOpen(false); setEditingClimb(null); }}
        onSave={handleSaveLog}
        initialGrade={editingClimb?.grade}
        initialResult={editingClimb?.result}
        initialAttempts={editingClimb?.attempts}
      />
      
      <UndoToast 
        visible={!!deletedClimbId} 
        message={climbs.find((c: any) => c.id === deletedClimbId)?.deleted_at === null ? "Climb logged" : "Climb deleted"}
        onUndo={() => {
          const isDeleted = climbs.find((c: any) => c.id === deletedClimbId)?.deleted_at !== null;
          if (isDeleted) {
            handleUndoDelete();
          } else {
            handleQuickAddUndo();
          }
        }} 
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
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
