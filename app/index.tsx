import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings as SettingsIcon, Plus, PlayCircle, Trophy } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { GlowBackdrop } from '../components/ui/GlowBackdrop';
import { listLayout } from '../theme/layout';
import { HeroCard } from '../components/ui/HeroCard';
import { ProjectCard } from '../components/ui/ProjectCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { StatTile } from '../components/ui/StatTile';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SessionCard } from '../components/ui/SessionCard';
import * as Q from '../db/queries';
import { GradePill } from '../components/ui/GradePill';
import { WeekStrip } from '../components/ui/WeekStrip';
import { VolumeChart } from '../components/ui/VolumeChart';
import { EmptyState } from '../components/ui/EmptyState';
import { useCelebration } from '../components/celebration/CelebrationProvider';
import { useCelebrationStore } from '../store/celebrationStore';
import { getStreakMilestone } from '../utils/celebrationLogic';
import { useTheme } from '../theme/useTheme';
import { useHomeSummary } from '../db/hooks';
import { useSessionActions } from '../hooks/useSessionActions';
import { StartSessionSheet } from '../components/session/StartSessionSheet';
import { triggerHaptic } from '../utils/haptics';
import { plural } from '../utils/string';

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
  const { triggerStreak } = useCelebration();
  const { hasStreakCelebrated, markStreakCelebrated } = useCelebrationStore();

  useEffect(() => {
    if (data?.streak) {
      const milestone = getStreakMilestone(data.streak);
      if (milestone && !hasStreakCelebrated(milestone)) {
        triggerStreak(milestone);
        markStreakCelebrated(milestone);
      }
    }
  }, [data?.streak, hasStreakCelebrated, markStreakCelebrated, triggerStreak]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

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
      {/* 7. Solid top scrim to prevent scroll content bleeding under status bar */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: insets.top, backgroundColor: colors.bg, zIndex: 10
      }} />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, space.xxl),
          paddingBottom: 120, // Clear the floating tab bar
          paddingHorizontal: space.lg + space.xs, // 20px sides per design system
        }}
      >
      {/* 1. Header — greeting, best grade chip, settings */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: space.xl,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: colors.textWhitePrimary }]}>
            Keep climbing, Climber
          </Text>
          {data.hardest30d && (
            <View style={{ marginTop: space.sm }}>
              <GradePill
                gradeIndex={data.hardest30d.gradeIndex}
                label={`Best ${data.hardest30d.gradeRaw} this month`}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <SettingsIcon size={20} color={colors.textWhiteSecondary} />
        </TouchableOpacity>
      </View>

      {/* 2. Today's Session Card — the ONE primary action */}
      <View style={{ marginBottom: space.xl }}>
        {data.activeSession ? (
          <HeroCard
            title="SESSION IN PROGRESS"
            value={formatDuration(elapsed)}
            subtitle={`${plural(data.activeSessionClimbCount, 'climb')} logged`}
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
                style={{
                  width: '100%',
                  height: 180,
                  borderRadius: radius.xl,
                  marginBottom: space.lg,
                }}
                resizeMode="cover"
              />
            )}
            <HeroCard
              title={data.hasAnyData ? "TODAY'S SESSION" : 'LOG YOUR FIRST SESSION'}
              subtitle={data.lastSession ? `${data.lastSession.gymName} · ${data.lastSessionRelative}` : 'Tap below to get started'}
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
        <View style={{ marginTop: space.lg, paddingBottom: space.xxl }}>
          <Text style={[type.body, { color: colors.textWhiteSecondary, textAlign: 'center' }]}>
            Start your first session to see your stats, streaks and progress here.
          </Text>
        </View>
      ) : (
        <>
          {/* 3. WeekStrip — the hero visual */}
          <View style={{ marginBottom: space.xl }}>
            <WeekStrip days={data.weekDays} streak={data.streak} />
          </View>

          {/* 4. Three StatTiles — big numbers, neutral cards */}
          <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
            <StatTile flex label="Sessions" value={data.sessionsThisWeek} />
            <StatTile flex label="Climbs" value={data.climbsThisWeek} />
            <StatTile
              flex
              label="Sends"
              value={data.sendsThisWeek}
              trend={data.flashesThisWeek > 0 ? plural(data.flashesThisWeek, 'flash', 'flashes') : undefined}
            />
          </View>

          {/* 5. Personal best banner */}
          {data.personalBest && (
            <Card style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              marginBottom: space.xl,
            }}>
              <GlowBackdrop />
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.accentSoft,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Trophy size={20} color={colors.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.textWhitePrimary }]}>
                  New best: {data.personalBest.gradeRaw}
                </Text>
                <Text style={[type.caption, { color: colors.textWhiteSecondary }]}>
                  {data.personalBest.daysAgo === 0
                    ? 'Today'
                    : data.personalBest.daysAgo === 1
                    ? 'Yesterday'
                    : `${data.personalBest.daysAgo} days ago`}
                </Text>
              </View>
            </Card>
          )}

          {/* 6. Projects strip — shared compact ProjectCard */}
          <View style={{ marginBottom: space.xl }}>
            <SectionHeader
              title="Projects"
              action={{ label: 'See all', onPress: () => router.push('/projects') }}
            />
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -(space.lg + space.xs) }}
              contentContainerStyle={{ paddingHorizontal: space.lg + space.xs }}
            >
              <View style={{ flexDirection: 'row', gap: space.md }}>
                {data.projects.length === 0 ? (
                  <Card
                    onPress={() => router.push('/projects')}
                    style={{ width: 220, padding: space.xl }}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.accentSoft,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: space.md,
                    }}>
                      <Plus size={22} color={colors.accentText} />
                    </View>
                    <Text style={[type.heading, { color: colors.textWhitePrimary, marginBottom: space.xs }]}>
                      Add a project
                    </Text>
                    <Text style={[type.caption, { color: colors.textWhiteSecondary }]}>
                      Track a climb you're working on
                    </Text>
                  </Card>
                ) : (
                  data.projects.slice(0, 5).map((p: any) => (
                    <Animated.View key={p.id} layout={listLayout} style={{ width: 260 }}>
                      <ProjectCard project={p} style={{ width: 260 }} />
                    </Animated.View>
                  ))
                )}
              </View>
            </Animated.ScrollView>
          </View>

          {/* 7. Weekly volume chart */}
          {data.weeklyVolume.length > 0 && (
            <View style={{ marginBottom: space.xl }}>
              <VolumeChart
                data={data.weeklyVolume}
                onPress={() => router.push('/analytics')}
              />
            </View>
          )}

          {/* 8. Recent sessions */}
          {data.recentSessions.length > 0 && (
            <View style={{ marginBottom: space.xxl }}>
              <SectionHeader title="Recent sessions" />
              <View style={{ gap: space.md }}>
                {data.recentSessions.map((s: any) => (
                  <Animated.View key={s.id} layout={listLayout}>
                    <SessionCard session={s} onDelete={(id) => { Q.deleteSession(id); }} />
                  </Animated.View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* Bottom padding for FloatingTabBar */}
      <View style={{ height: 100 }} />

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
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, height: insets.top,
        backgroundColor: colors.bg,
      }, scrimStyle]} pointerEvents="none" />
    </View>
  );
}
