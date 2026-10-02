import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings as SettingsIcon, Plus, PlayCircle, Trophy } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { HeroCard } from '../components/ui/HeroCard';
import { ProjectCard } from '../components/ui/ProjectCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { StatTile } from '../components/ui/StatTile';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SessionRow } from '../components/ui/SessionRow';
import { GradePill } from '../components/ui/GradePill';
import { WeekStrip } from '../components/ui/WeekStrip';
import { VolumeChart } from '../components/ui/VolumeChart';
import { EmptyState } from '../components/ui/EmptyState';
import { useTheme } from '../theme/useTheme';
import { useHomeSummary } from '../db/hooks';
import { useSessionActions } from '../hooks/useSessionActions';
import { StartSessionSheet } from '../components/session/StartSessionSheet';
import { triggerHaptic } from '../utils/haptics';

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 60) return '<1 min';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, type, space, radius, shadow, gradeBand } = useTheme();

  const data = useHomeSummary();
  const { startOrResume } = useSessionActions();
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Live timer for active session
  useEffect(() => {
    if (!data.activeSession) { setElapsed(0); return; }
    const start = data.activeSession.startTime;
    setElapsed(Date.now() - start);
    const interval = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, [data.activeSession?.id]);

  const handleStartSession = () => {
    triggerHaptic('medium');
    if (data.activeSession) {
      startOrResume();
    } else {
      setIsStartSheetOpen(true);
    }
  };

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: Math.max(insets.top, space.xxl), paddingHorizontal: space.lg }}
      >
      {/* 1. Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.xl }}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={[type.body, { color: colors.textMuted, marginBottom: space.xs }]}>{greeting}</Text>
          <Text style={[type.display, { color: colors.text }]}>Welcome back</Text>
          {data.hardest30d && (
            <View style={{ marginTop: space.sm }}>
               <GradePill gradeIndex={data.hardest30d.gradeIndex} label={`Best ${data.hardest30d.gradeRaw}`} />
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={{
            padding: space.sm,
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: space.sm
          }}
        >
          <SettingsIcon size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. HeroCard — the ONE primary action */}
      <View style={{ marginBottom: space.xl }}>
        {data.activeSession ? (
          <HeroCard
            title="SESSION IN PROGRESS"
            value={formatDuration(elapsed)}
            subtitle={`${data.activeSessionClimbCount} climb${data.activeSessionClimbCount !== 1 ? 's' : ''} logged`}
          >
            <PrimaryButton
              testID="resume-session-btn"
              label="Resume session"
              icon={<PlayCircle color={colors.textOnAccent} size={20} />}
              onPress={handleStartSession}
            />
          </HeroCard>
        ) : (
          <>
            {!data.hasAnyData && (
              <Image
                source={require('../assets/images/welcome-hero.png')}
                style={{ width: '100%', height: 180, borderRadius: radius.xl, marginBottom: space.lg }}
                resizeMode="cover"
              />
            )}
            <HeroCard
              title={data.hasAnyData ? 'READY TO CLIMB?' : 'LOG YOUR FIRST SESSION'}
              subtitle={
                data.lastSession
                  ? `${data.lastSession.gymName} · ${data.lastSessionRelative}`
                  : 'Tap below to get started'
              }
            >
              <PrimaryButton
                testID="start-session-btn"
                label="Start session"
                icon={<PlayCircle color={colors.textOnAccent} size={20} />}
                onPress={handleStartSession}
              />
            </HeroCard>
          </>
        )}
      </View>

      {/* First-time user: stop here */}
      {!data.hasAnyData ? (
        <View style={{ marginTop: space.lg }}>
          <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
            Start your first session to see your stats, streaks and progress here.
          </Text>
        </View>
      ) : (
        <>
          {/* 3. WeekStrip */}
          <View style={{ marginBottom: space.xl }}>
            <WeekStrip days={data.weekDays} streak={data.streak} />
          </View>

          {/* 4. Three StatTiles */}
          <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
            <StatTile flex label="SESSIONS" value={data.sessionsThisWeek} tintBg={colors.accentSoft} />
            <StatTile flex label="CLIMBS" value={data.climbsThisWeek} />
            <StatTile
              flex
              label="SENDS"
              value={data.sendsThisWeek}
              tintBg={colors.flashSoft}
              trend={data.flashesThisWeek > 0 ? `${data.flashesThisWeek} flash${data.flashesThisWeek !== 1 ? 'es' : ''}` : undefined}
            />
          </View>

          {/* 5. Projects strip */}
          <View style={{ marginBottom: space.xl }}>
            <SectionHeader
              title="Projects"
              action={{ label: 'See all', onPress: () => router.push('/projects') }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, gap: space.md }}>
                {data.projects.length === 0 ? (
                  <Card
                    onPress={() => router.push('/projects')}
                    style={{ width: 160, padding: space.lg }}
                  >
                    <Plus size={20} color={colors.textMuted} style={{ marginBottom: space.sm }} />
                    <Text style={[type.heading, { color: colors.text, marginBottom: space.xs }]}>
                      Add your first project
                    </Text>
                    <Text style={[type.caption, { color: colors.textMuted }]}>
                      Track a climb you're working on
                    </Text>
                  </Card>
                ) : (
                  data.projects.slice(0, 5).map((p: any) => (
                    <Card
                      key={p.id}
                      onPress={() => router.push('/projects')}
                      style={{ width: 160, padding: space.md }}
                    >
                      <GradePill
                        gradeIndex={p.normalizedDifficulty ?? p.grade_index ?? 0}
                        label={p.gradeRaw ?? p.grade_raw ?? '—'}
                      />
                      <Text
                        style={[type.heading, { color: colors.text, marginTop: space.sm, marginBottom: space.xs }]}
                        numberOfLines={1}
                      >
                        {p.title}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: space.lg }}>
                        <View>
                          <Text style={[type.caption, { color: colors.textMuted }]}>Burns</Text>
                          <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>{p.attempts || 0}</Text>
                        </View>
                        {(p.highWaterMarkMoves ?? p.high_water_mark_moves) ? (
                          <View>
                            <Text style={[type.caption, { color: colors.textMuted }]}>Linked</Text>
                            <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>
                              {p.highWaterMarkMoves ?? p.high_water_mark_moves}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </Card>
                  ))
                )}
              </View>
            </ScrollView>
          </View>

          {/* 6. Weekly volume chart */}
          {data.weeklyVolume.length > 0 && (
            <View style={{ marginBottom: space.xl }}>
              <VolumeChart
                data={data.weeklyVolume}
                
                onPress={() => router.push('/analytics')}
              />
            </View>
          )}

          {/* 7. PersonalBestBanner */}
          {data.personalBest && (
            <View
              style={{
                backgroundColor: colors.accentSoft,
                borderRadius: radius.md,
                padding: space.lg,
                marginBottom: space.xl,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
              }}
            >
              <Trophy size={20} color={colors.accentText} />
              <Text style={[type.heading, { color: colors.accentText, flex: 1 }]}>
                New best: {data.personalBest.gradeRaw},{' '}
                {data.personalBest.daysAgo === 0
                  ? 'today'
                  : data.personalBest.daysAgo === 1
                  ? 'yesterday'
                  : `${data.personalBest.daysAgo} days ago`}
              </Text>
            </View>
          )}

          {/* 8. Recent sessions */}
          {data.recentSessions.length > 0 && (
            <View style={{ marginBottom: space.xxl }}>
              <SectionHeader title="Recent Sessions" />
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {data.recentSessions.map((s: any, i: number) => (
                  <SessionRow
                    key={s.id}
                    id={s.id}
                    gymName={s.gymName}
                    startedAt={s.startTime}
                    durationMs={s.durationMs}
                    climbs={s.climbs}
                    sends={s.sends}
                    hardestGrade={s.hardestGradeRaw}
                    isLast={i === data.recentSessions.length - 1}
                  />
                ))}
              </Card>
            </View>
          )}
        </>
      )}

      {/* Bottom padding for FloatingTabBar */}
      <View style={{ height: 80 }} />

      {/* StartSessionSheet */}
      <StartSessionSheet
        visible={isStartSheetOpen}
        onClose={() => setIsStartSheetOpen(false)}
        onStart={(gymName) => {
          setIsStartSheetOpen(false);
          startOrResume(gymName);
        }}
      />
      </Animated.ScrollView>
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: insets.top,
        backgroundColor: colors.bg,
        opacity: scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' }),
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }} pointerEvents="none" />
    </View>
  );
}
