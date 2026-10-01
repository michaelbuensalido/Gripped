import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../components/ui/Screen';
import { StatTile } from '../../../components/ui/StatTile';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ClimbRow } from '../../../components/ui/ClimbRow';
import { UndoToast } from '../../../components/ui/UndoToast';
import { useTheme } from '../../../theme/useTheme';
import { getSessionSummary, softDeleteBoulderLog, undoDeleteBoulderLog, deleteSession } from '../../../db/queries';
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

  const [deletedClimbId, setDeletedClimbId] = useState<string | null>(null);
  const climbs = useSessionClimbs(id || '');
  const summary = id ? getSessionSummary(id) : null;

  if (!summary) {
    return (
      <Screen title="Session Detail">
        <Text style={{ color: colors.textMuted }}>Session not found.</Text>
      </Screen>
    );
  }

  const handleDeleteClimb = (climbId: string) => {
    triggerHaptic('light');
    softDeleteBoulderLog(climbId);
    setDeletedClimbId(climbId);
  };

  const handleUndoDelete = () => {
    if (deletedClimbId) {
      triggerHaptic('light');
      undoDeleteBoulderLog(deletedClimbId);
      setDeletedClimbId(null);
    }
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
          <ClimbRow key={c.id} climb={c} onDelete={handleDeleteClimb} />
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

      <UndoToast visible={!!deletedClimbId} onUndo={handleUndoDelete} onDismiss={() => setDeletedClimbId(null)} />
    </Screen>
  );
}
