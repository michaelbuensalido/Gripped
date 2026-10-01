import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { SessionRow } from '../components/ui/SessionRow';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAllSessions } from '../db/hooks';
import { getSessionSummary } from '../db/queries';
import { useTheme } from '../theme/useTheme';

export default function SessionHistoryScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const sessions = useAllSessions();
  const [filter, setFilter] = useState('');

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    sessions.forEach(s => {
      if (filter && !s.gymName.toLowerCase().includes(filter.toLowerCase())) return;
      
      const d = new Date(s.startTime);
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!map.has(monthYear)) map.set(monthYear, []);
      map.get(monthYear)!.push(s);
    });
    return Array.from(map.entries());
  }, [sessions, filter]);

  return (
    <Screen title="Session History" scroll>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardMuted,
        paddingHorizontal: space.md,
        borderRadius: radius.md,
        marginBottom: space.xl,
      }}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter by gym name..."
          placeholderTextColor={colors.textMuted}
          style={[type.body, { flex: 1, paddingVertical: space.md, paddingHorizontal: space.sm, color: colors.text }]}
        />
      </View>

      {grouped.length === 0 ? (
        <Text style={[type.body, { color: colors.textMuted, textAlign: 'center', marginTop: space.xxl }]}>
          No sessions found.
        </Text>
      ) : (
        <View style={{ gap: space.xl }}>
          {grouped.map(([month, monthSessions]) => (
            <View key={month}>
              <SectionHeader title={month} />
              <View style={{ backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' }}>
                {monthSessions.map((s, i) => {
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
