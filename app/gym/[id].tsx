import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Plus, Star } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { usePreferences } from '../../utils/preferences';
import { ProjectCard } from '../../components/ui/ProjectCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScalePressable } from '../../components/ui/ScalePressable';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SessionRow } from '../../components/ui/SessionRow';
import { CreateProjectModal } from '../../components/project/CreateProjectModal';
import { useRichProjects, useRecentSessions } from '../../db/hooks';
import { getGymHubData, getSessionSummary } from '../../db/queries';
import { useSessionStore } from '../../store/sessionStore';
import { triggerHaptic } from '../../utils/haptics';

export default function GymDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const decodedId = decodeURIComponent(id || '');
  const { colors, type, space, radius } = useTheme();
  const { homeGym, setHomeGym, formatGrade } = usePreferences();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startQuickSession = useSessionStore((s) => s.startQuickSession);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  const isHomeGym = Boolean(homeGym && homeGym.toLowerCase() === decodedId.toLowerCase());

  const allSessions = useRecentSessions();
  const projects = useRichProjects().filter(
    (p) => (p.gymName || '').toLowerCase() === decodedId.toLowerCase()
  );
  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const sentProjects = projects.filter((p) => p.status === 'sent');

  const gymHub = useMemo(() => getGymHubData(decodedId), [decodedId, allSessions.length]);
  const gymSessionSummaries = useMemo(
    () =>
      (gymHub.recentSessions || []).map((s: any) => ({
        session: s,
        summary: getSessionSummary(s.id),
      })),
    [gymHub.recentSessions]
  );

  const handleToggleHomeGym = () => {
    triggerHaptic('selection');
    setHomeGym(isHomeGym ? null : decodedId);
  };

  const handleStartSessionHere = () => {
    triggerHaptic('medium');
    startQuickSession(decodedId);
    router.push('/session');
  };

  const handleOpenAddProject = () => {
    triggerHaptic('light');
    setIsAddProjectOpen(true);
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (from === 'explore') {
      router.navigate('/explore' as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/explore' as any);
    }
  };

  const hardestSendLabel =
    gymHub.hardestGradeIndex !== null && gymHub.hardestGradeIndex !== undefined
      ? formatGrade(gymHub.hardestGradeIndex)
      : '–';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.lg,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: space.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: space.sm }}>
          <ScalePressable
            onPress={handleBack}
            haptic="light"
            activeScale={0.92}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft color={colors.text} size={22} />
          </ScalePressable>

          <View style={{ marginLeft: space.sm, flex: 1 }}>
            {isHomeGym && (
              <Text
                style={[
                  type.label,
                  { color: colors.accent, fontSize: 10, letterSpacing: 1.5, marginBottom: 1 },
                ]}
              >
                HOME GYM
              </Text>
            )}
            <Text style={[type.display, { color: colors.text, fontSize: 22 }]} numberOfLines={1}>
              {decodedId}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ScalePressable
            onPress={handleToggleHomeGym}
            haptic="selection"
            activeScale={0.92}
            accessibilityRole="button"
            accessibilityLabel={isHomeGym ? 'Remove as Home Gym' : 'Set as Home Gym'}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              backgroundColor: isHomeGym ? colors.accentSoft : colors.card,
              borderWidth: 1,
              borderColor: isHomeGym ? colors.accent : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star
              size={18}
              color={isHomeGym ? colors.accent : colors.textMuted}
              fill={isHomeGym ? colors.accent : 'transparent'}
            />
          </ScalePressable>

          <ScalePressable
            onPress={handleOpenAddProject}
            haptic="light"
            activeScale={0.95}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              paddingHorizontal: space.md,
              height: 44,
              borderRadius: radius.pill,
            }}
          >
            <Plus size={16} color={colors.textOnAccent} style={{ marginRight: 4 }} />
            <Text style={[type.label, { color: colors.textOnAccent, fontWeight: '700' }]}>
              Project
            </Text>
          </ScalePressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 130,
          paddingHorizontal: space.lg,
        }}
      >
        {/* Gym Hub Telemetry & Quick Session CTA */}
        <Card style={{ marginTop: space.sm, marginBottom: space.xl }}>
          <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.cardMuted,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[type.label, { color: colors.textMuted, fontSize: 10 }]}>VISITS</Text>
              <Text style={[type.stat, { color: colors.text, fontSize: 22, marginTop: 4 }]}>
                {gymHub.visits}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.cardMuted,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[type.label, { color: colors.textMuted, fontSize: 10 }]}>SENDS</Text>
              <Text style={[type.stat, { color: colors.text, fontSize: 22, marginTop: 4 }]}>
                {gymHub.totalSends}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.cardMuted,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[type.label, { color: colors.textMuted, fontSize: 10 }]}>PEAK SEND</Text>
              <Text style={[type.stat, { color: colors.accent, fontSize: 22, marginTop: 4 }]}>
                {hardestSendLabel}
              </Text>
            </View>
          </View>

          <PrimaryButton
            label={`Start Session at ${decodedId}`}
            icon={<Play size={16} color={colors.textOnAccent} fill={colors.textOnAccent} />}
            onPress={handleStartSessionHere}
          />
        </Card>

        {/* Active Projects */}
        <SectionHeader title="Active Projects" />
        {activeProjects.length === 0 ? (
          <EmptyState
            illustration={require('../../assets/illustrations/empty-projects.jpg')}
            title="No active projects"
            body={`Start a new project to track your burns and beta at ${decodedId}.`}
            cta={
              <TouchableOpacity
                onPress={handleOpenAddProject}
                style={{
                  backgroundColor: colors.accent,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  marginTop: space.sm,
                }}
              >
                <Text style={[type.heading, { color: colors.textOnAccent, fontSize: 15 }]}>
                  Add Project to this Gym
                </Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <View style={{ gap: space.md }}>
            {activeProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </View>
        )}

        {/* Completed Projects */}
        {sentProjects.length > 0 && (
          <View style={{ marginTop: space.xxl }}>
            <SectionHeader title="Completed Projects" />
            <View style={{ gap: space.md }}>
              {sentProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </View>
          </View>
        )}

        {/* Past Sessions at this Gym */}
        <View style={{ marginTop: space.xxl }}>
          <SectionHeader title="Session History Here" />
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {gymSessionSummaries.length === 0 ? (
              <View style={{ padding: space.xl, alignItems: 'center' }}>
                <Text style={[type.body, { color: colors.textMuted }]}>
                  No completed sessions logged at {decodedId} yet.
                </Text>
              </View>
            ) : (
              gymSessionSummaries.map(({ session: s, summary }, i: number) => (
                <SessionRow
                  key={s.id}
                  id={s.id}
                  gymName={s.gym_name || decodedId}
                  startedAt={s.started_at}
                  durationMs={summary.duration}
                  climbs={summary.climbs}
                  sends={summary.sends}
                  hardestGrade={
                    summary.hardestGradeRaw !== '–' ? summary.hardestGradeRaw : undefined
                  }
                  isLast={i === gymSessionSummaries.length - 1}
                />
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      {/* In-place project creation modal */}
      <CreateProjectModal
        visible={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        defaultGym={decodedId}
      />
    </View>
  );
}

