import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../components/ui/Screen';
import { StatTile } from '../../../components/ui/StatTile';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { GradePill } from '../../../components/ui/GradePill';
import { ResultChip, ResultType } from '../../../components/ui/ResultChip';
import { Card } from '../../../components/ui/Card';
import { useTheme } from '../../../theme/useTheme';
import { Text, View } from 'react-native';
import { getSessionSummary, getClimbsForSession } from '../../../db/queries';

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, space, type } = useTheme();

  const summary = id ? getSessionSummary(id) : null;
  const climbs = id ? getClimbsForSession(id) : [];

  if (!summary) {
    return <Screen title="Session Detail"><Text style={{ color: colors.textMuted }}>Session not found.</Text></Screen>;
  }

  return (
    <Screen title={summary.gymName || 'Session'} subtitle={formatDuration(summary.duration)}>
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
        <StatTile label="Climbs" value={summary.climbs} />
        <StatTile label="Sends" value={summary.sends} />
        <StatTile label="Flashes" value={summary.flashes} />
      </View>
      <SectionHeader title="Climbs" />
      <View style={{ gap: space.sm }}>
        {climbs.map((c: any) => (
          <Card key={c.id} variant="muted" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <GradePill gradeIndex={c.grade_index} label={c.grade_raw} />
              <ResultChip result={(c.result as ResultType) || 'attempt'} />
            </View>
            <Text style={[{ color: colors.textMuted }, type.caption]}>{c.attempts} attempt(s)</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
