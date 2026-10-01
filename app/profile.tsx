import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { SessionRow } from '../components/ui/SessionRow';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { useAllSessions } from '../db/hooks';
import { getSessionSummary } from '../db/queries';
import { useTheme } from '../theme/useTheme';
import { triggerHaptic } from '../utils/haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const sessions = useAllSessions();
  const [activeGym, setActiveGym] = useState<string | null>(null);

  // Extract unique gyms for filter
  const uniqueGyms = useMemo(() => {
    const gyms = new Set<string>();
    sessions.forEach(s => {
      if (s.gymName) gyms.add(s.gymName);
    });
    return Array.from(gyms);
  }, [sessions]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    sessions.forEach(s => {
      if (activeGym && s.gymName !== activeGym) return;
      
      const d = new Date(s.startTime);
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!map.has(monthYear)) map.set(monthYear, []);
      map.get(monthYear)!.push(s);
    });
    return Array.from(map.entries());
  }, [sessions, activeGym]);

  return (
    <Screen 
      title="Profile" 
      subtitle="Session History" 
      scroll 
      headerRight={
        <View style={{ padding: 8, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
          <SettingsIcon size={20} color={colors.text} onPress={() => router.push('/settings')} />
        </View>
      }
    >
      {/* Gym Filter Chips */}
      {uniqueGyms.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.xl }}>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <FilterChip 
              label="All Gyms" 
              active={activeGym === null} 
              onPress={() => { triggerHaptic('light'); setActiveGym(null); }} 
            />
            {uniqueGyms.map(gym => (
              <FilterChip 
                key={gym}
                label={gym} 
                active={activeGym === gym} 
                onPress={() => { triggerHaptic('light'); setActiveGym(gym); }} 
              />
            ))}
          </View>
        </ScrollView>
      )}

      {grouped.length === 0 ? (
        <EmptyState 
          icon={<SettingsIcon size={24} />} 
          title="No sessions found" 
          body="Go log some climbs!" cta={<PrimaryButton label="Start a Session" onPress={() => router.push('/')} />} 
        />
      ) : (
        <View style={{ gap: space.xl, paddingBottom: 100 }}>
          {grouped.map(([month, monthSessions]) => (
            <View key={month}>
              <SectionHeader title={month} />
              <View style={{ backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' }}>
                {monthSessions.map((s: any, i: number) => {
                  const summary = getSessionSummary(s.id);
                  return (
                    <SessionRow
                      key={s.id}
                      id={s.id}
                      gymName={s.gymName}
                      startedAt={s.startTime}
                      durationMs={summary.duration}
                      hardestGrade={summary.hardestGradeRaw !== '–' ? summary.hardestGradeRaw : undefined}
                      isLast={i === monthSessions.length - 1}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
