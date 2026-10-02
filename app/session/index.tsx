import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, MoreHorizontal } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ClimbRow } from '../../components/ui/ClimbRow';
import { GradePill } from '../../components/ui/GradePill';
import { SyncChip } from '../../components/ui/SyncChip';
import { LogSheet } from '../../components/session/LogSheet';
import { UndoToast } from '../../components/ui/UndoToast';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession, useSessionClimbs, useRecentGrades, useRichProjects } from '../../db/hooks';
import { useSessionStore } from '../../store/sessionStore';
import { deleteSession, softDeleteBoulderLog, undoDeleteBoulderLog } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';
import { useCelebration } from '../../components/celebration/CelebrationProvider';
import { useCelebrationStore } from '../../store/celebrationStore';
import { shouldFireSmallCelebration, shouldFireMediumCelebration, shouldFireBigCelebration } from '../../utils/celebrationLogic';
import { getDatabase } from '../../db/schema';
import { isSend } from '../../utils/isSend';
import { ResultType } from '../../components/ui/ResultChip';
import { ResultToggle } from '../../components/session/ResultToggle';
import { RestTimer } from '../../components/session/RestTimer';
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

// Extract LiveTimer so it doesn't re-render the whole screen
const LiveTimer = React.memo(({ startTime, textStyle }: { startTime: number, textStyle: any }) => {
  const [elapsed, setElapsed] = useState(Date.now() - startTime);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <Text style={textStyle}>{formatActiveDuration(elapsed)}</Text>;
});

function CompactStatTile({ label, value, highlightAnim }: { label: string, value: string | number, highlightAnim?: Animated.Value }) {
  const { colors, type, radius, space } = useTheme();
  
  const bg = highlightAnim 
    ? highlightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.card, colors.accentSoft]
      })
    : colors.card;

  return (
    <Animated.View style={{ flex: 1, backgroundColor: bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, minHeight: 64, padding: space.sm, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[type.stat, { color: colors.text, fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Animated.View>
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
  
  const { logGenericAscent, setActiveSessionId, setRestTimer } = useSessionStore();

  const [isLogSheetOpen, setLogSheetOpen] = useState(false);
  const [editingClimb, setEditingClimb] = useState<any>(null);
  const [deletedClimbId, setDeletedClimbId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const [quickResult, setQuickResult] = useState<ResultType>('top');
    const pulseAnim = useRef(new Animated.Value(0)).current;

  // Filter out soft-deleted climbs from UI display
  const activeClimbs = useMemo(() => climbs.filter((c: any) => c.deleted_at === null), [climbs]);

  // Projects strip: in-progress projects at the current gym
  const activeProjects = useMemo(() => {
    if (!session?.gymName) return [];
    return allProjects.filter((p: any) => p.status === 'in_progress' && p.gymName === session.gymName);
  }, [allProjects, session?.gymName]);

  const sends = useMemo(() => activeClimbs.filter((c: any) => isSend(c.result)), [activeClimbs]);
  const flashes = useMemo(() => activeClimbs.filter((c: any) => c.result === 'flash'), [activeClimbs]);
  
  const hardestIndex = useMemo(() => {
    return sends.reduce((max: number, c: any) => Math.max(max, c.grade_index ?? 0), 0);
  }, [sends]);
  
  const hardestLabel = sends.length > 0 ? (sends.find((c: any) => (c.grade_index ?? 0) === hardestIndex)?.grade_raw || '–') : '–';

  const { triggerSmall, triggerMedium, triggerBig } = useCelebration();
  const { hasCelebrated, markCelebrated } = useCelebrationStore();

  const [globalHardest, setGlobalHardest] = useState<number | null>(null);
  const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const db = getDatabase();
      const logsRow = db.getFirstSync<any>('SELECT MAX(grade_index) as m FROM boulder_logs WHERE result IN ("flash", "top", "send") AND deleted_at IS NULL AND session_id != ?', [session?.id]);
      setGlobalHardest(logsRow?.m ?? null);
      
      const sessionRow = db.getFirstSync<any>('SELECT count(*) as c FROM sessions WHERE end_time IS NOT NULL AND id != ?', [session?.id]);
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
            sessions: proj?.sessions || 1
          });
          markCelebrated(c.id, 'big');
          celebrated = true;
        } else if (shouldFireMediumCelebration(c.grade_index, globalHardest, totalSessionsCount)) {
          triggerMedium(`New hardest: ${c.grade_raw}`);
          markCelebrated(c.id, 'medium');
          setGlobalHardest(Math.max(globalHardest ?? 0, c.grade_index));
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
            Animated.timing(pulseAnim, { toValue: 0, duration: 400, delay: 600, useNativeDriver: false })
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
  }, [activeClimbs, globalHardest, totalSessionsCount, allProjects, hasCelebrated, markCelebrated, triggerBig, triggerMedium, triggerSmall]);

  if (!session) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[type.body, { color: colors.textMuted }]}>No active session.</Text>
        </View>
      </Screen>
    );
  }

  const startRestTimer = () => {
    setRestTimer(Date.now() + 3 * 60 * 1000, true);
  };

  const handleQuickAdd = (grade: { gradeRaw: string, gradeIndex: number }) => {
    triggerHaptic('light');
    const attemptId = logGenericAscent({
      gradeRaw: grade.gradeRaw,
      outcome: quickResult === 'top' ? 'send' : quickResult,
      movesLinked: 1,
      notes: '',
    });
    setDeletedClimbId(attemptId);
    startRestTimer();
  };

  const handleLogProjectAttempt = (project: any) => {
    triggerHaptic('light');
    const attemptId = logGenericAscent({
      projectId: project.id,
      gradeRaw: project.gradeRaw ?? project.grade_raw,
      outcome: 'attempt',
      movesLinked: 1,
      notes: '',
    });
    setDeletedClimbId(attemptId);
    startRestTimer();
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
    startRestTimer();
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
        paddingBottom: space.xs,
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

        {/* Center Title Block */}
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
            <TouchableOpacity style={{ padding: space.md, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => { setShowMenu(false); router.push(('/session/detail/' + session.id + '?variant=edit') as any); }}>
              <Text style={[type.body, { color: colors.text }]}>Change gym</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDiscardSession} style={{ padding: space.md }}>
              <Text style={[type.body, { color: colors.dangerText }]}>Discard session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <RestTimer />

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 160 }}>
        {/* Compact Stat Tiles */}
        <View style={{ flexDirection: 'row', gap: space.xs, marginBottom: space.xl, marginTop: space.sm }}>
          <CompactStatTile label="Climbs" value={activeClimbs.length} />
          <CompactStatTile label="Sends" value={sends.length} />
          <CompactStatTile label="Flashes" value={flashes.length} />
          <CompactStatTile label="Hardest" value={hardestLabel} highlightAnim={pulseAnim} />
        </View>

        {/* Quick Add Row */}
        <View style={{ marginBottom: space.lg }}>
          <View style={{ marginBottom: space.md }}>
            <ResultToggle value={quickResult} onChange={setQuickResult} />
          </View>

          {/* Quick +1 Attempt button (56px) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const lastClimb = activeClimbs[0];
              const gradeToUse = lastClimb ? { gradeRaw: lastClimb.grade_raw, gradeIndex: lastClimb.grade_index } : (recentGrades[0] || { gradeRaw: 'V4', gradeIndex: 4 });
              handleQuickAdd(gradeToUse);
            }}
            accessibilityRole="button"
            accessibilityLabel="Quick +1 Attempt on current grade"
            style={{
              height: 56,
              minHeight: 56,
              backgroundColor: colors.cardMuted,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.md,
              gap: space.xs,
              marginBottom: space.md,
            }}
          >
            <Plus size={20} color={colors.accentText} />
            <Text style={[type.heading, { color: colors.text }]}>
              +1 Attempt on {activeClimbs[0]?.grade_raw || recentGrades[0]?.gradeRaw || 'V4'}
            </Text>
          </TouchableOpacity>

          <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 1 }]}>
            Tap a grade to log
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, gap: space.sm }}>
              {recentGrades.map((g) => (
                <TouchableOpacity
                  key={g.gradeRaw}
                  onPress={() => handleQuickAdd(g)}
                  onLongPress={() => {
                    setEditingClimb({ grade: g.gradeRaw, result: quickResult, attempts: 1 });
                    setLogSheetOpen(true);
                  }}
                  delayLongPress={400}
                  accessibilityRole="button"
                  accessibilityLabel={`Log ${g.gradeRaw}`}
                  style={{
                    height: 56,
                    minHeight: 56,
                    minWidth: 64,
                    paddingHorizontal: space.md,
                    backgroundColor: colors.card,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GradePill gradeIndex={g.gradeIndex} label={g.gradeRaw} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Projects Strip */}
        {activeProjects.length > 0 && (
          <View style={{ marginBottom: space.xl }}>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>ACTIVE PROJECTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}>
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
                      onLogAttempt={() => handleLogProjectAttempt(p)}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Insight Cards */}
        <SessionInsights climbs={activeClimbs} />

        {/* Climb List */}
        <View style={{ gap: space.sm }}>
          {[...activeClimbs].sort((a: any, b: any) => b.logged_at - a.logged_at).map((climb: any) => (
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
            <View style={{ alignItems: 'center', paddingTop: space.md }}>
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
        message={climbs.find((c: any) => c.id === deletedClimbId)?.deleted_at === null ? 'Climb logged' : 'Climb deleted'}
        onUndo={() => {
          if (deletedClimbId) {
            undoDeleteBoulderLog(deletedClimbId);
            setDeletedClimbId(null);
          }
        }} 
        onDismiss={() => {
          setDeletedClimbId(null);
          
        }} 
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
