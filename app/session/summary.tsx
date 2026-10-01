import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { StatTile } from '../../components/ui/StatTile';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { GradePill } from '../../components/ui/GradePill';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme/useTheme';
import { getAllSessions, getClimbsForSession } from '../../db/queries';

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function SessionSummaryScreen() {
  const router = useRouter();
  const { colors, space, type, radius, shadow } = useTheme();

  // Get the most recently ended session
  const session = useMemo(() => {
    const sessions = getAllSessions();
    return sessions.find((s: any) => s.endTime != null) ?? sessions[0] ?? null;
  }, []);

  const climbs = useMemo(() => {
    if (!session) return [];
    return getClimbsForSession(session.id);
  }, [session?.id]);

  const sends = climbs.filter(
    (c: any) => c.result === 'send' || c.result === 'top' || c.result === 'flash'
  );
  const flashes = climbs.filter((c: any) => c.result === 'flash');
  const hardest = sends.reduce(
    (max: any, c: any) => (!max || c.grade_index > max.grade_index ? c : max),
    null
  );

  const duration = session
    ? ((session.endTime ?? Date.now()) - session.startTime)
    : 0;

  return (
    <Screen title="Session Done" subtitle={session?.gymName ?? ''} scroll>
      {/* Hero summary card */}
      <Card variant="hero" style={{ marginBottom: space.xl }}>
        <Text style={[type.label, { color: colors.accentText, marginBottom: space.xs }]}>
          Session Complete
        </Text>
        <Text style={[type.stat, { color: colors.text, marginBottom: space.xs }]}>
          {formatDuration(duration)}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {new Date(session?.startTime ?? Date.now()).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Card>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
        <StatTile label="Climbs" value={climbs.length} flex />
        <StatTile label="Sends" value={sends.length} flex />
        <StatTile label="Flashes" value={flashes.length} flex />
      </View>

      {/* Hardest send highlight */}
      {hardest && (
        <Card
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            marginBottom: space.xl,
            backgroundColor: colors.flashSoft,
          }}
        >
          <GradePill gradeIndex={hardest.grade_index ?? 0} label={hardest.grade_raw} />
          <View>
            <Text style={[type.label, { color: colors.flashText }]}>Hardest Send</Text>
            <Text style={[type.heading, { color: colors.text }]}>{hardest.grade_raw}</Text>
          </View>
        </Card>
      )}

      {/* Session notes if any */}
      {session?.notes ? (
        <View style={{ marginBottom: space.xl }}>
          <SectionHeader title="Session Notes" />
          <View style={{ backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.md }}>
            <Text style={[type.body, { color: colors.text }]}>{session.notes}</Text>
          </View>
        </View>
      ) : null}

      {/* CTAs */}
      <View style={{ gap: space.md, marginTop: space.sm }}>
        <PrimaryButton label="GO TO PROGRESS" onPress={() => router.replace('/analytics')} />
        <SecondaryButton label="Home" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
