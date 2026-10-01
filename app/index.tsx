import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Settings as SettingsIcon, Play, PlayCircle } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { useTheme } from '../theme/useTheme';
import { getActiveSession, getAllSessions, getWeeklyVolume, getStreak, getSessionSummary } from '../db/queries';
import { useSessionStore } from '../store/sessionStore';
import { triggerHaptic } from '../utils/haptics';
import { SessionRow } from '../components/ui/SessionRow';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  
  const [activeSession, setActiveSession] = useState<any>(null);
  const [lastSession, setLastSession] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  
  const startQuickSession = useSessionStore((s) => s.startQuickSession);

  useFocusEffect(
    useCallback(() => {
      const active = getActiveSession();
      setActiveSession(active);
      
      const all = getAllSessions();
      if (active && all.length > 1) {
        setLastSession(all[1]);
      } else if (!active && all.length > 0) {
        setLastSession(all[0]);
      } else {
        setLastSession(null);
      }
      
      setStreak(getStreak());
      
      const vols = getWeeklyVolume('7d');
      setWeeklyVolume(vols.length > 0 ? vols[vols.length - 1].count : 0);
    }, [])
  );

  const handleStartSession = () => {
    triggerHaptic('medium');
    if (activeSession) {
      router.push('/session/active');
    } else {
      // 1-tap start as per USER_FLOW.md
      // We start it immediately using the last gym if available
      const lastGym = lastSession?.gymName || 'Local Gym';
      startQuickSession(lastGym);
      router.push('/session/active');
    }
  };

  return (
    <Screen 
      title="CruxLog" 
      subtitle="LEDGER HUB"
      headerRight={
        <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 8, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
          <SettingsIcon size={20} color={colors.text} />
        </TouchableOpacity>
      }
      scroll
    >
      {/* Primary Action */}
      <View style={{ marginBottom: space.xl, marginTop: space.sm }}>
        <PrimaryButton 
          testID={activeSession ? "resume-session-btn" : "start-session-btn"}
          label={activeSession ? "RESUME SESSION" : "START SESSION"}
          icon={<PlayCircle color={colors.textOnAccent} size={20} />}
          onPress={handleStartSession}
          style={activeSession ? { backgroundColor: colors.flashText } : undefined}
        />
      </View>

      {/* Week Overview */}
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
        <StatTile flex label="Streak (wks)" value={streak} />
        <StatTile flex label="Climbs this week" value={weeklyVolume} />
      </View>

      {/* Last Session */}
      {lastSession && (
        <>
          <SectionHeader title="Last Session" />
          <Card style={{ padding: 0, overflow: 'hidden', marginBottom: space.xl }}>
            <SessionRow 
              id={lastSession.id}
              gymName={lastSession.gymName}
              startedAt={lastSession.startTime}
              durationMs={getSessionSummary(lastSession.id).duration}
              hardestGrade={getSessionSummary(lastSession.id).hardestGradeRaw}
              isLast={true}
            />
          </Card>
        </>
      )}

      {/* Active Projects could go here later if we implement the preview */}
    </Screen>
  );
}
