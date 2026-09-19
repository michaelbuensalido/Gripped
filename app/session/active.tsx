import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../store/sessionStore';
import { LoggerControls } from '../../components/session/LoggerControls';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Check, GripVertical } from 'lucide-react-native';

// ─── Volume Key Binding ────────────────────────────────────────────────────────
// Lazily import to avoid crashing if not yet linked (native rebuild required)
let VolumeManager: any = null;
try {
  VolumeManager = require('react-native-volume-manager').VolumeManager;
} catch (_) {
  // Not yet linked — silently skip. Hardware buttons won't work until pod install.
}

// ─── Scoreboard ────────────────────────────────────────────────────────────────
function Scoreboard() {
  const ascents = useSessionStore((s) => s.ascents);
  const groups = useSessionStore((s) => s.groups);
  const activeSession = useSessionStore((s) => s.activeSession);

  const globalSends = ascents.filter((a) => a.status === 'SEND').length;
  const globalFlashes = ascents.filter((a) => a.status === 'FLASH').length;
  const globalBurns = ascents.filter((a) => a.status === 'ATTEMPT').length;
  
  const groupSends = groups.reduce((acc, g) => acc + g.logs.filter(l => l.outcome === 'send').length, 0);
  const groupFlashes = groups.reduce((acc, g) => acc + g.logs.filter(l => l.outcome === 'flash').length, 0);
  const groupBurns = groups.reduce((acc, g) => acc + g.logs.filter(l => l.outcome === 'attempt').length, 0);

  const sends = globalSends + groupSends;
  const flashes = globalFlashes + groupFlashes;
  const burns = globalBurns + groupBurns;
  const total = ascents.length + groups.reduce((acc, g) => acc + g.logs.length, 0);

  // Gravity = ratio of successful tops to total attempts
  const gravity = total > 0 ? ((sends + flashes) / total) * 100 : 0;

  const elapsed = activeSession
    ? Math.floor((Date.now() - activeSession.startTime) / 1000)
    : 0;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <View style={styles.scoreboard}>
      {/* Header row */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreCell}>
          <Text style={styles.scoreValue}>{sends + flashes}</Text>
          <Text style={styles.scoreLabel}>SENDS</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreCell}>
          <Text style={styles.scoreValue}>{burns}</Text>
          <Text style={styles.scoreLabel}>BURNS</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreCell}>
          <Text style={[styles.scoreValue, { color: '#8E7CFF' }]}>
            {gravity.toFixed(0)}%
          </Text>
          <Text style={styles.scoreLabel}>GRAVITY</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreCell}>
          <Text style={[styles.scoreValue, { color: '#555562' }]}>
            {mm}:{ss}
          </Text>
          <Text style={styles.scoreLabel}>TIME</Text>
        </View>
      </View>

      {/* Burn strip — last 8 ascents as status pills */}
      {ascents.length > 0 && (
        <View style={styles.burnStrip}>
          {[...ascents].slice(-8).reverse().map((a) => (
            <View
              key={a.id}
              style={[
                styles.statusPill,
                a.status === 'SEND' || a.status === 'FLASH'
                  ? styles.pillSend
                  : styles.pillAttempt,
              ]}
            >
              <Text style={[
                styles.pillText,
                a.status === 'SEND' || a.status === 'FLASH'
                  ? { color: '#8E7CFF' }
                  : { color: '#555562' },
              ]}>
                {a.status === 'FLASH' ? 'F' : a.status === 'SEND' ? 'S' : '·'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Session Checklist ────────────────────────────────────────────────────────

function SessionChecklist() {
  const groups = useSessionStore((s) => s.groups);
  const toggleGroupCompletion = useSessionStore((s) => s.toggleGroupCompletion);
  const reorderGroups = useSessionStore((s) => s.reorderGroups);

  const renderItem = ({ item, drag, isActive }: any) => {
    const isDone = item.isCompleted;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={drag}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleGroupCompletion(item.id);
          }}
          style={[
            styles.checklistCard,
            isActive && styles.checklistCardActive,
            isDone && styles.checklistCardDone,
          ]}
        >
          <View style={styles.checklistCardLeft}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleGroupCompletion(item.id);
              }}
              style={[styles.checkbox, isDone && styles.checkboxChecked]}
            >
              {isDone && <Check size={14} color="#111113" strokeWidth={3} />}
            </TouchableOpacity>
            <View>
              <Text style={[styles.checklistCardTitle, isDone && styles.checklistCardTitleDone]}>
                {item.zoneName}
              </Text>
              <Text style={styles.checklistCardSubtitle}>
                {item.logs.length} burns planned • {item.defaultRestSeconds}s rest
              </Text>
            </View>
          </View>
          <View style={styles.dragHandle}>
            <GripVertical size={20} color="#555562" />
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (groups.length === 0) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
      <Text style={styles.checklistHeader}>SESSION PLAN</Text>
      <DraggableFlatList
        data={groups}
        onDragEnd={({ data }: { data: any[] }) => reorderGroups(data.map((g: any) => g.id))}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

// ─── Active Session Screen ──────────────────────────────────────────────────────

export default function ActiveSessionScreen() {
  const router = useRouter();
  const activeSession = useSessionStore((s) => s.activeSession);
  const logAscent = useSessionStore((s) => s.logAscent);
  const completeSession = useSessionStore((s) => s.completeSession);

  // Default grade scalar — could be wired to a grade picker in future
  const DEFAULT_GRADE = 5;

  const handleAttempt = React.useCallback(() => {
    logAscent(DEFAULT_GRADE, 'ATTEMPT');
  }, [logAscent]);

  const handleSend = React.useCallback(() => {
    logAscent(DEFAULT_GRADE, 'SEND');
  }, [logAscent]);

  // ─── Volume Key Binding ───────────────────────────────────────────────────
  useEffect(() => {
    if (!VolumeManager) return;

    // Suppress native iOS volume HUD
    VolumeManager.showNativeVolumeUI({ enabled: false });

    const sub = VolumeManager.addVolumeListener((result: { volume: number }) => {
      // We can't directly tell UP vs DOWN from the volume value delta
      // so we track the previous volume and compute direction
      const prev = (ActiveSessionScreen as any)._lastVol ?? result.volume;
      const direction = result.volume >= prev ? 'up' : 'down';
      (ActiveSessionScreen as any)._lastVol = result.volume;

      if (direction === 'up') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        logAscent(DEFAULT_GRADE, 'SEND');
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        logAscent(DEFAULT_GRADE, 'ATTEMPT');
      }
    });

    return () => {
      sub.remove();
      VolumeManager.showNativeVolumeUI({ enabled: true });
    };
  }, [logAscent]);

  // Redirect if no active session
  useEffect(() => {
    if (!activeSession) {
      router.replace('/');
    }
  }, [activeSession]);

  const handleEnd = () => {
    completeSession({
      title: activeSession?.gymName ?? 'Session',
      notes: '',
      gymName: activeSession?.gymName ?? '',
      rpe: null,
      mediaUris: [],
    });
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerPillar}>
            {activeSession?.gymName ?? '—'}
          </Text>
          <Text style={styles.headerCaption}>ACTIVE SESSION</Text>
        </View>
        <TouchableOpacity
          onPress={handleEnd}
          style={styles.endButton}
          activeOpacity={0.7}
        >
          <Text style={styles.endButtonText}>END</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Scoreboard ─────────────────────────────────────────────────── */}
      <Scoreboard />

      {/* ─── Session Checklist ───────────────────────────────────────────── */}
      <SessionChecklist />

      {/* ─── Gesture Logger ─────────────────────────────────────────────── */}
      <LoggerControls onAttempt={handleAttempt} onSend={handleSend} />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111113',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272F',
  },
  headerPillar: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555562',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  endButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF453A',
    backgroundColor: 'rgba(255,69,58,0.08)',
  },
  endButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF453A',
    letterSpacing: 2,
  },

  // ─── Scoreboard ──────────────────────────────────────────────────────────
  scoreboard: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272F',
    paddingVertical: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
  },
  scoreValue: {
    // Strict tabular-nums so digits never reflow
    fontVariant: ['tabular-nums'],
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555562',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#27272F',
  },

  // Burn strip
  burnStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  statusPill: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillSend: {
    backgroundColor: 'rgba(142,124,255,0.12)',
    borderColor: '#8E7CFF',
  },
  pillAttempt: {
    backgroundColor: '#141417',
    borderColor: '#3E3E48',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Checklist
  checklistHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A8A98',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  checklistCard: {
    backgroundColor: '#19191D',
    borderWidth: 1,
    borderColor: '#27272F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checklistCardActive: {
    backgroundColor: '#1E1E24',
    borderColor: '#3A3A46',
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  checklistCardDone: {
    backgroundColor: '#141417',
    borderColor: '#1E1E24',
    opacity: 0.6,
  },
  checklistCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3A3A46',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8E7CFF',
    borderColor: '#8E7CFF',
  },
  checklistCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  checklistCardTitleDone: {
    textDecorationLine: 'line-through',
    color: '#8A8A98',
  },
  checklistCardSubtitle: {
    color: '#8A8A98',
    fontSize: 12,
  },
  dragHandle: {
    paddingLeft: 12,
    paddingVertical: 8,
  }
});
