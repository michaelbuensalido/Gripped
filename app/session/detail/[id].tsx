import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Screen } from '../../../components/ui/Screen';
import { StatTile } from '../../../components/ui/StatTile';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { GradePill } from '../../../components/ui/GradePill';
import { ResultChip, ResultType } from '../../../components/ui/ResultChip';
import { Card } from '../../../components/ui/Card';
import { useTheme } from '../../../theme/useTheme';
import { getSessionSummary, deleteBoulderLog, deleteSession } from '../../../db/queries';
import { useSessionClimbs } from '../../../db/hooks';
import { triggerHaptic } from '../../../utils/haptics';

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, space, type, radius } = useTheme();

  // Make it reactive so edits/deletes update the list
  const climbs = useSessionClimbs(id || '');
  const summary = id ? getSessionSummary(id) : null;

  if (!summary) {
    return <Screen title="Session Detail"><Text style={{ color: colors.textMuted }}>Session not found.</Text></Screen>;
  }

  const handleDeleteClimb = (climbId: string) => {
    Alert.alert('Delete Climb', 'Remove this climb from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('light');
          deleteBoulderLog(climbId);
        }
      }
    ]);
  };

  const handleDeleteSession = () => {
    Alert.alert('Delete Session', 'Permanently delete this entire session and all its climbs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('medium');
          if (id) deleteSession(id);
          router.back();
        }
      }
    ]);
  };

  return (
    <Screen title={summary.gymName || 'Session'} subtitle={formatDuration(summary.duration)} scroll>
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
        <StatTile flex label="Climbs" value={climbs.length} />
        <StatTile flex label="Sends" value={climbs.filter((c: any) => c.result !== 'attempt').length} />
        <StatTile flex label="Hardest" value={summary.hardestGradeRaw} />
      </View>

      <SectionHeader title="Climbs" />
      <View style={{ gap: space.sm, marginBottom: space.xxl }}>
        {climbs.map((c: any) => (
          <View
            key={c.id}
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
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <GradePill gradeIndex={c.grade_index} label={c.grade_raw} />
              <ResultChip result={(c.result as ResultType) || 'attempt'} />
              {c.attempts > 1 && (
                <Text style={[type.caption, { color: colors.textMuted }]}>×{c.attempts}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleDeleteClimb(c.id)} hitSlop={10}>
              <Trash2 size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleDeleteSession}
        style={{
          padding: space.lg,
          borderRadius: radius.md,
          backgroundColor: colors.cardMuted,
          alignItems: 'center',
          marginTop: space.xl,
        }}
      >
        <Text style={[type.heading, { color: colors.danger }]}>Delete Session</Text>
      </TouchableOpacity>
    </Screen>
  );
}
