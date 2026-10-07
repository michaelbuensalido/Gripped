import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bell,
  ChevronDown,
  Clock,
  Mountain,
  Plus,
  PlayCircle,
  Trophy,
} from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { GlowBackdrop } from '../components/ui/GlowBackdrop';
import { listLayout } from '../theme/layout';
import { ProjectCard } from '../components/ui/ProjectCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SessionCard } from '../components/ui/SessionCard';
import { StatTile } from '../components/ui/StatTile';
import * as Q from '../db/queries';
import { WeekStrip } from '../components/ui/WeekStrip';
import { VolumeChart } from '../components/ui/VolumeChart';
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
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, type, space, radius, shadow } = useTheme();

  const data = useHomeSummary();
  const { startOrResume } = useSessionActions();
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const { triggerStreak } = useCelebration();
  const { hasStreakCelebrated, markStreakCelebrated } = useCelebrationStore();

  useFocusEffect(
    useCallback(() => {
      import('../db/events').then((mod) => mod.dbEvents.emit());
    }, [])
  );

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
  }, [data.activeSession?.id, data.activeSession?.startTime]);

  const handleStartSession = () => {
    triggerHaptic('medium');
    if (data.activeSession) {
      startOrResume();
    } else {
      setIsStartSheetOpen(true);
    }
  };

  const highWatermark = data.hardest30d ? data.hardest30d.gradeRaw : '7A';

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 8,
          paddingBottom: 130, // Clear the floating tab bar
          paddingHorizontal: 20,
        }}
      >
        {/* 1. Header Bar: Avatar Pill on Left, Notification Bell on Right */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          {/* User profile dropdown pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.bevelHighlight,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            <Image
              source={require('../assets/maya_avatar.jpg')}
              style={{ width: 34, height: 34, borderRadius: 17 }}
              resizeMode="cover"
            />
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', fontFamily: type.heading.fontFamily }}>
              Maya Vong
            </Text>
            <ChevronDown size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Notification Bell Button with Neon Purple Dot */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.bevelHighlight,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bell size={20} color={colors.text} strokeWidth={1.8} />
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 9,
                height: 9,
                borderRadius: 4.5,
                backgroundColor: colors.accent,
              }}
            />
          </TouchableOpacity>
        </View>

        {/* 2. Main Title & Grade Pill */}
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '700', fontFamily: type.display.fontFamily, marginBottom: 8, letterSpacing: -0.5 }}>
          Keep climbing, Maya
        </Text>
        <View
          style={{
            backgroundColor: colors.flashSoft,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 12,
            alignSelf: 'flex-start',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: colors.flash, fontSize: 15, fontWeight: '700', fontFamily: type.heading.fontFamily }}>
            {highWatermark}
          </Text>
        </View>

        {/* 3. Three Bento Stat Tiles */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
          <StatTile flex value={data.sessionsThisWeek || 0} label={"SESSIONS\nTHIS WEEK"} />
          <StatTile flex value={data.climbsThisWeek || 0} label={"CLIMBS\nLOGGED"} />
          <StatTile flex value={data.sendsThisWeek || 0} label={"SENDS\nTHIS WEEK"} />
        </View>

        {/* 4. Hero Bento Card */}
        <View
          style={{
            backgroundColor: colors.materialBase,
            borderRadius: 26,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
            ...shadow.floating,
          }}
        >
          {/* Header Row: Label & Pagination Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {data.activeSession 
                ? "TODAY'S SESSION" 
                : (data.projects && data.projects.length > 0 
                    ? "NEXT OBJECTIVE" 
                    : (data.lastSession ? "LATEST SESSION" : "WELCOME"))}
            </Text>
            {(!data.activeSession && data.projects && data.projects.length > 1) && (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                {data.projects.map((_, i) => (
                  <View key={i} style={{ 
                    width: heroIndex === i ? 10 : 8, 
                    height: heroIndex === i ? 10 : 8, 
                    borderRadius: 5, 
                    backgroundColor: heroIndex === i ? colors.accent : 'rgba(255, 255, 255, 0.2)' 
                  }} />
                ))}
              </View>
            )}
          </View>

          {data.activeSession || !data.projects || data.projects.length === 0 ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Text style={{ color: colors.text, fontSize: data.activeSession ? 30 : 24, fontWeight: '700', fontFamily: type.stat.fontFamily }}>
                  {data.activeSession 
                    ? formatDuration(elapsed) 
                    : (data.lastSession ? data.lastSession.gymName : 'Let\'s send it')}
                </Text>
              </View>

              <Text style={{ color: colors.textWhiteSecondary, fontSize: 14, fontFamily: type.body.fontFamily, marginBottom: 14 }}>
                {data.activeSession
                  ? `${plural(data.activeSessionClimbCount, 'climb')} logged`
                  : (data.lastSession 
                      ? `Last climbed ${data.lastSessionRelative.toLowerCase()}` 
                      : 'Log your first session today')}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.accentSoft,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  alignSelf: 'flex-start',
                  marginBottom: 18,
                }}
              >
                <Text style={{ color: colors.accentText, fontSize: 12, fontWeight: '600', fontFamily: type.caption.fontFamily }}>
                  {data.activeSession 
                    ? `Elapsed ${formatDuration(elapsed)}` 
                    : (data.hardest30d ? `Hardest recent: ${data.hardest30d.gradeRaw}` : 'Fresh Start')}
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 40));
                if (newIndex !== heroIndex) setHeroIndex(newIndex);
              }}
              style={{ marginHorizontal: -20, marginBottom: 18 }}
            >
              {data.projects.map((proj, i) => (
                <View key={proj.id} style={{ width: Dimensions.get('window').width - 40, paddingHorizontal: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700', fontFamily: type.stat.fontFamily }}>
                      {proj.title}
                    </Text>
                  </View>

                  <Text style={{ color: colors.textWhiteSecondary, fontSize: 14, fontFamily: type.body.fontFamily, marginBottom: 14 }}>
                    Active Project • {proj.gradeRaw || 'Unknown Grade'}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: colors.accentSoft,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radius.pill,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ color: colors.accentText, fontSize: 12, fontWeight: '600', fontFamily: type.caption.fontFamily }}>
                      {proj.attempts || 0} burns logged
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Massive START SESSION Button */}
          <TouchableOpacity
            testID={data.activeSession ? 'resume-session-btn' : 'start-session-btn'}
            activeOpacity={0.85}
            onPress={handleStartSession}
            style={{
              backgroundColor: colors.accent,
              height: 56,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, fontFamily: type.heading.fontFamily }}>
              {data.activeSession ? 'RESUME SESSION' : 'START SESSION'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. WeekStrip — Current week streak */}
        <View style={{ marginBottom: 24 }}>
          <WeekStrip days={data.weekDays} streak={data.streak} />
        </View>

        {/* 6. Personal best banner */}
        {data.personalBest && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              backgroundColor: colors.cardMuted,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
          >
            <GlowBackdrop />
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.accentSoft,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Trophy size={20} color={colors.accentText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.heading, { color: colors.text, fontWeight: '700' }]}>
                New best: {data.personalBest.gradeRaw}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {data.personalBest.daysAgo === 0
                  ? 'Today'
                  : data.personalBest.daysAgo === 1
                  ? 'Yesterday'
                  : `${data.personalBest.daysAgo} days ago`}
              </Text>
            </View>
          </View>
        )}

        {/* 7. Projects Strip — Project cards carousel */}
        <Animated.View entering={FadeInDown.delay(200).springify().damping(14)} style={{ marginBottom: 26 }}>
          <SectionHeader
            title="Projects"
            action={{ label: 'See all', onPress: () => router.push('/projects') }}
          />
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {data.projects.length === 0 ? (
                <TouchableOpacity
                  onPress={() => router.push('/projects')}
                  style={{
                    width: 220,
                    padding: 20,
                    backgroundColor: colors.cardMuted,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.accentSoft,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Plus size={22} color={colors.accentText} />
                  </View>
                  <Text style={[type.heading, { color: colors.text, marginBottom: 4, fontWeight: '700' }]}>
                    Add a project
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    Track a climb you're working on
                  </Text>
                </TouchableOpacity>
              ) : (
                data.projects.slice(0, 5).map((p: any) => (
                  <Animated.View key={p.id} layout={listLayout} style={{ width: 260 }}>
                    <ProjectCard project={p} style={{ width: 260 }} disableSwipe={true} />
                  </Animated.View>
                ))
              )}
            </View>
          </Animated.ScrollView>
        </Animated.View>

        {/* 8. Weekly Volume Chart */}
        {data.weeklyVolume.length > 0 && (
          <View style={{ marginBottom: 26 }}>
            <VolumeChart
              data={data.weeklyVolume}
              onPress={() => router.push('/analytics')}
            />
          </View>
        )}

        {/* 9. Recent Sessions List */}
        {data.recentSessions.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader title="Recent sessions" />
            <View style={{ gap: 12 }}>
              {data.recentSessions.map((s: any) => (
                <Animated.View key={s.id} layout={listLayout}>
                  <SessionCard session={s} onDelete={(id) => { Q.deleteSession(id); }} />
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* StartSessionSheet */}
      <StartSessionSheet
        visible={isStartSheetOpen}
        onClose={() => setIsStartSheetOpen(false)}
        onStart={(gymName) => {
          setIsStartSheetOpen(false);
          startOrResume(gymName);
        }}
      />
    </View>
  );
}
