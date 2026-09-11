import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Clock,
  TrendingUp,
  Play,
  Flame,
  Video,
  X,
  Plus,
  Compass,
} from 'lucide-react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { FLOATING_CARD_STYLE, THEME_COLORS } from '../constants/theme';
import {
  getAllSessionSummaries,
  getProjectBookLogs,
  getBetaVaultLogs,
  type SessionSummary,
  type ProjectBookItem,
  type BetaVaultItem,
} from '../db/queries';
import { triggerHaptic } from '../utils/haptics';

type LogbookSegment = 'sessions' | 'projects' | 'beta';

const SAMPLE_BETA_ITEMS: BetaVaultItem[] = [
  {
    id: 'sample-beta-1',
    gradeRaw: 'V6',
    title: 'Ripple Effect Beta',
    zoneName: 'Overhang Cave',
    gymName: 'Crux Climbing Gym',
    durationSeconds: 24,
    date: 'Oct 8',
  },
  {
    id: 'sample-beta-2',
    gradeRaw: 'V5',
    title: 'Slab Rise Balance Walk',
    zoneName: 'Slab Wall',
    gymName: 'Crux Climbing Gym',
    durationSeconds: 32,
    date: 'Oct 6',
  },
  {
    id: 'sample-beta-3',
    gradeRaw: 'V7',
    title: 'Kars Sloper Dyno',
    zoneName: 'Main Roof',
    gymName: 'Crux Climbing Gym',
    durationSeconds: 19,
    date: 'Oct 2',
  },
  {
    id: 'sample-beta-4',
    gradeRaw: 'V8',
    title: 'Poly Edge Micro Crimp',
    zoneName: 'Competition Wall',
    gymName: 'Crux Climbing Gym',
    durationSeconds: 28,
    date: 'Sep 29',
  },
];

const BETA_THUMBNAILS: Record<string, any> = {
  V6: require('../assets/holds-images/v6-ripple-effect-square.jpg'),
  V5: require('../assets/holds-images/v5-slab-rise.png'),
  V7: require('../assets/holds-images/v7-kars-sloper.png'),
  V8: require('../assets/holds-images/v8-poly-edge.png'),
};

function formatSessionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${month} ${day} • ${hours}:${minutes} ${ampm}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatMonthYear(timestamp: number): string {
  const d = new Date(timestamp);
  const months = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function LogbookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { segment } = useLocalSearchParams<{ segment?: string }>();
  const initialSegment: LogbookSegment =
    segment === 'projects' || segment === 'beta' || segment === 'sessions'
      ? segment
      : 'sessions';
  const [activeSegment, setActiveSegment] = useState<LogbookSegment>(initialSegment);

  useEffect(() => {
    if (segment === 'projects' || segment === 'beta' || segment === 'sessions') {
      setActiveSegment(segment);
    }
  }, [segment]);

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [projects, setProjects] = useState<ProjectBookItem[]>([]);
  const [betaLogs, setBetaLogs] = useState<BetaVaultItem[]>([]);
  const [showSampleBeta, setShowSampleBeta] = useState(true);
  const [activePreviewBeta, setActivePreviewBeta] = useState<BetaVaultItem | null>(null);

  const loadData = useCallback(() => {
    try {
      setSessions(getAllSessionSummaries());
      setProjects(getProjectBookLogs());
      const realBeta = getBetaVaultLogs();
      setBetaLogs(realBeta);
    } catch (err) {
      console.error('Failed to load logbook data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Group sessions by Month/Year
  const sessionsByMonth = useMemo(() => {
    const groups: { monthYear: string; items: SessionSummary[] }[] = [];
    sessions.forEach((s) => {
      const my = formatMonthYear(s.startTime);
      let group = groups.find((g) => g.monthYear === my);
      if (!group) {
        group = { monthYear: my, items: [] };
        groups.push(group);
      }
      group.items.push(s);
    });
    return groups;
  }, [sessions]);

  // Group projects by Grade Tier
  const projectsByTier = useMemo(() => {
    const tiers: { tier: string; items: ProjectBookItem[] }[] = [
      { tier: 'V8+', items: [] },
      { tier: 'V6–V7', items: [] },
      { tier: 'V4–V5', items: [] },
      { tier: 'V0–V3', items: [] },
    ];
    projects.forEach((p) => {
      let target = tiers.find((t) => t.tier === p.gradeTier);
      if (!target) {
        target = tiers[tiers.length - 1];
      }
      target.items.push(p);
    });
    return tiers.filter((t) => t.items.length > 0);
  }, [projects]);

  const displayBetaItems = betaLogs.length > 0 ? betaLogs : (showSampleBeta ? SAMPLE_BETA_ITEMS : []);

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 190,
          paddingHorizontal: 16,
        }}
      >
        {/* ── Top Header ────────────────────────────────────────── */}
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 34,
              fontWeight: '700',
              letterSpacing: -0.5,
            }}
          >
            Logbook
          </Text>
          <Text
            style={{
              color: '#9A9AA6',
              fontSize: 14,
              marginTop: 4,
              fontWeight: '400',
            }}
          >
            Past sessions, projecting queue & beta
          </Text>
        </View>

        {/* ── 3-Way Segmented Switcher ─────────────────────────── */}
        <View
          style={{
            backgroundColor: '#16161C',
            borderColor: '#2C2C35',
            borderWidth: 1,
            borderRadius: 18,
            padding: 5,
            flexDirection: 'row',
            marginBottom: 22,
          }}
        >
          {(
            [
              { id: 'sessions', label: 'Sessions' },
              { id: 'projects', label: 'Projects' },
              { id: 'beta', label: 'Beta Vault' },
            ] as const
          ).map((seg) => {
            const isActive = activeSegment === seg.id;
            return (
              <TouchableOpacity
                key={seg.id}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveSegment(seg.id);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: isActive ? 'rgba(30, 30, 36, 0.85)' : 'transparent',
                  borderColor: isActive ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
                  borderWidth: isActive ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    color: isActive ? '#FFFFFF' : '#8A8A98',
                    fontSize: 13,
                    fontWeight: isActive ? '700' : '500',
                  }}
                >
                  {seg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── View 1: Sessions History ─────────────────────────── */}
        {activeSegment === 'sessions' && (
          <View>
            {sessions.length === 0 ? (
              <View
                style={[
                  FLOATING_CARD_STYLE,
                  {
                    backgroundColor: 'rgba(30, 30, 36, 0.45)',
                    borderWidth: 1,
                    borderColor: '#2C2C35',
                    borderStyle: 'dashed',
                    borderRadius: 24,
                    padding: 32,
                    alignItems: 'center',
                    marginTop: 10,
                  },
                ]}
              >
                <Image
                  source={require('../assets/illustrations/chalk_bag_empty_state.png')}
                  style={{ width: 120, height: 90, marginBottom: 14 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  No Logged Sessions
                </Text>
                <Text
                  style={{
                    color: '#9A9AA6',
                    fontSize: 13,
                    textAlign: 'center',
                    lineHeight: 18,
                    marginBottom: 20,
                  }}
                >
                  Complete your first climbing session to view your history and progression here.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/session/new')}
                  style={{
                    backgroundColor: '#8E7CFF',
                    paddingHorizontal: 22,
                    paddingVertical: 12,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                    Start a Session
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              sessionsByMonth.map((group) => (
                <View key={group.monthYear} style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      color: '#8A8A98',
                      fontSize: 12,
                      fontWeight: '700',
                      letterSpacing: 1.2,
                      marginBottom: 10,
                      paddingHorizontal: 4,
                    }}
                  >
                    {group.monthYear}
                  </Text>

                  {group.items.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        triggerHaptic('light');
                        router.push(`/session/detail/${s.id}`);
                      }}
                      style={[
                        FLOATING_CARD_STYLE,
                        {
                          borderRadius: 20,
                          padding: 16,
                          marginBottom: 12,
                        },
                      ]}
                    >
                      {/* Top Row: Gym Name & Date */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 16,
                            fontWeight: '700',
                            flex: 1,
                            marginRight: 8,
                          }}
                          numberOfLines={1}
                        >
                          {s.gymName || 'Climbing Session'}
                        </Text>
                        <Text
                          style={{
                            color: '#9A9AA6',
                            fontSize: 12,
                            fontWeight: '500',
                          }}
                        >
                          {formatSessionDate(s.startTime)}
                        </Text>
                      </View>

                      {/* Middle Chips Row */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Duration Pill */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: '#16161C',
                            borderColor: '#2C2C35',
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 9,
                            paddingVertical: 4.5,
                          }}
                        >
                          <Clock size={12} color="#9A9AA6" />
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                            {formatDuration(s.durationMinutes)}
                          </Text>
                        </View>

                        {/* Sends Pill */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: '#16161C',
                            borderColor: '#2C2C35',
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 9,
                            paddingVertical: 4.5,
                          }}
                        >
                          <TrendingUp size={12} color="#8E7CFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                            {s.sendCount} {s.sendCount === 1 ? 'Send' : 'Sends'}
                          </Text>
                        </View>

                        {/* Hardest Grade Pill */}
                        {s.hardestGrade && (
                          <View
                            style={{
                              backgroundColor: s.sendCount > 0 ? '#6EE756' : 'rgba(142, 124, 255, 0.16)',
                              borderColor: s.sendCount > 0 ? '#6EE756' : 'rgba(142, 124, 255, 0.45)',
                              borderWidth: s.sendCount > 0 ? 0 : 1,
                              borderRadius: 10,
                              paddingHorizontal: 10,
                              paddingVertical: 4.5,
                              shadowColor: s.sendCount > 0 ? '#6EE756' : '#8E7CFF',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: s.sendCount > 0 ? '#111115' : '#8E7CFF',
                                fontSize: 12,
                                fontWeight: '800',
                              }}
                            >
                              {s.hardestGrade}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Notes snippet */}
                      {Boolean(s.notes) && (
                        <View style={{ marginTop: 10, paddingTop: 8, borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1 }}>
                          <Text
                            style={{
                              color: '#9A9AA6',
                              fontSize: 12,
                              fontStyle: 'italic',
                            }}
                            numberOfLines={1}
                          >
                            "{s.notes}"
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── View 2: Project Book (Unsent Boulders) ────────────── */}
        {activeSegment === 'projects' && (
          <View>
            {projects.length === 0 ? (
              <View
                style={[
                  FLOATING_CARD_STYLE,
                  {
                    backgroundColor: 'rgba(30, 30, 36, 0.45)',
                    borderWidth: 1,
                    borderColor: '#2C2C35',
                    borderStyle: 'dashed',
                    borderRadius: 24,
                    padding: 32,
                    alignItems: 'center',
                    marginTop: 10,
                  },
                ]}
              >
                <Image
                  source={require('../assets/illustrations/chalk_bag_empty_state.png')}
                  style={{ width: 120, height: 90, marginBottom: 14 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  No Unsent Projects
                </Text>
                <Text
                  style={{
                    color: '#9A9AA6',
                    fontSize: 13,
                    textAlign: 'center',
                    lineHeight: 18,
                  }}
                >
                  Every route you attempted was sent! When you log attempts on tricky climbs, they will appear here as your project queue.
                </Text>
              </View>
            ) : (
              projectsByTier.map((tierGroup) => (
                <View key={tierGroup.tier} style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      color: '#8A8A98',
                      fontSize: 12,
                      fontWeight: '700',
                      letterSpacing: 1.2,
                      marginBottom: 10,
                      paddingHorizontal: 4,
                    }}
                  >
                    TIER {tierGroup.tier}
                  </Text>

                  {tierGroup.items.map((project) => (
                    <View
                      key={`${project.gradeRaw}-${project.zoneName}`}
                      style={[
                        FLOATING_CARD_STYLE,
                        {
                          borderRadius: 20,
                          padding: 16,
                          marginBottom: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        },
                      ]}
                    >
                      {/* Left: Grade pill */}
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          backgroundColor: '#6EE756',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 14,
                        }}
                      >
                        <Text
                          style={{
                            color: '#111115',
                            fontSize: 17,
                            fontWeight: '800',
                          }}
                        >
                          {project.gradeRaw}
                        </Text>
                      </View>

                      {/* Middle: Zone name + total burns + date */}
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 15,
                            fontWeight: '700',
                          }}
                          numberOfLines={1}
                        >
                          {project.zoneName}
                        </Text>
                        <Text
                          style={{
                            color: '#9A9AA6',
                            fontSize: 12,
                            marginTop: 2,
                            fontWeight: '500',
                          }}
                        >
                          {project.totalAttempts} total {project.totalAttempts === 1 ? 'burn' : 'burns'} • {formatSessionDate(project.lastAttempted).split('•')[0]}
                        </Text>
                      </View>

                      {/* Right: Log Burn button */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          triggerHaptic('medium');
                          router.push('/session/new');
                        }}
                        style={{
                          height: 36,
                          backgroundColor: '#8E7CFF',
                          borderRadius: 18,
                          paddingHorizontal: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#8E7CFF',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.35,
                          shadowRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: '700',
                          }}
                        >
                          Log Burn
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── View 3: Beta Vault (Media Grid) ──────────────────── */}
        {activeSegment === 'beta' && (
          <View>
            {displayBetaItems.length === 0 ? (
              <View
                style={[
                  FLOATING_CARD_STYLE,
                  {
                    backgroundColor: 'rgba(30, 30, 36, 0.45)',
                    borderWidth: 1,
                    borderColor: '#2C2C35',
                    borderStyle: 'dashed',
                    borderRadius: 24,
                    padding: 32,
                    alignItems: 'center',
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: 'rgba(142, 124, 255, 0.12)',
                    borderColor: 'rgba(142, 124, 255, 0.25)',
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Video size={32} color="#8E7CFF" />
                </View>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  No Beta Clips Saved
                </Text>
                <Text
                  style={{
                    color: '#9A9AA6',
                    fontSize: 13,
                    textAlign: 'center',
                    lineHeight: 18,
                    marginBottom: 20,
                  }}
                >
                  Attach video clips and beta footage to your session logs to review movement and analyze crux sequences.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    triggerHaptic('light');
                    setShowSampleBeta(true);
                  }}
                  style={{
                    backgroundColor: THEME_COLORS.cardSurface,
                    borderColor: THEME_COLORS.cardBorder,
                    borderTopColor: 'rgba(255, 255, 255, 0.14)',
                    borderWidth: 1,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 18,
                  }}
                >
                  <Text style={{ color: '#8E7CFF', fontSize: 13, fontWeight: '700' }}>
                    View Sample Beta Clips
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {showSampleBeta && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
                    <Text style={{ color: '#8A8A98', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }} className="uppercase">
                      SAMPLE BETA LIBRARY
                    </Text>
                    <TouchableOpacity onPress={() => setShowSampleBeta(false)}>
                      <Text style={{ color: '#8E7CFF', fontSize: 12, fontWeight: '600' }}>Clear Samples</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {displayBetaItems.map((beta) => {
                    const thumb = BETA_THUMBNAILS[beta.gradeRaw] || require('../assets/holds-images/v6-ripple-effect-square.jpg');
                    const cardWidth = (Dimensions.get('window').width - 32 - 12) / 2;
                    return (
                      <TouchableOpacity
                        key={beta.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          triggerHaptic('light');
                          setActivePreviewBeta(beta);
                        }}
                        style={[
                          FLOATING_CARD_STYLE,
                          {
                            width: cardWidth,
                            height: cardWidth * 1.25,
                            borderRadius: 20,
                            overflow: 'hidden',
                            position: 'relative',
                            justifyContent: 'space-between',
                            padding: 8,
                          },
                        ]}
                      >
                        {/* Background Thumbnail */}
                        <Image
                          source={thumb}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0.85,
                          }}
                          resizeMode="cover"
                        />
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(10, 10, 14, 0.4)',
                          }}
                        />

                        {/* Top Row: Grade Pill */}
                        <View
                          style={{
                            backgroundColor: beta.gradeRaw === 'V7' || beta.gradeRaw === 'V8' ? '#6EE756' : '#8E7CFF',
                            alignSelf: 'flex-start',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text
                            style={{
                              color: beta.gradeRaw === 'V7' || beta.gradeRaw === 'V8' ? '#111115' : '#FFFFFF',
                              fontSize: 12,
                              fontWeight: '800',
                            }}
                          >
                            {beta.gradeRaw}
                          </Text>
                        </View>

                        {/* Center: Play Icon Overlay */}
                        <View
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: [{ translateX: -22 }, { translateY: -22 }],
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(18, 18, 24, 0.8)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: 1.5,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                        </View>

                        {/* Bottom Row: Title + Duration */}
                        <View
                          style={{
                            backgroundColor: 'rgba(20, 20, 26, 0.85)',
                            borderRadius: 12,
                            padding: 6,
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            borderWidth: 1,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                            numberOfLines={1}
                          >
                            {beta.title}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                            <Text style={{ color: '#9A9AA6', fontSize: 10, fontWeight: '500' }}>
                              {beta.zoneName}
                            </Text>
                            <Text style={{ color: '#8E7CFF', fontSize: 10, fontWeight: '700' }}>
                              0:{beta.durationSeconds.toString().padStart(2, '0')}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Beta Video Playback Modal ─────────────────────────── */}
      <Modal
        visible={activePreviewBeta !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePreviewBeta(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', padding: 20 }}>
          <View
            style={[
              FLOATING_CARD_STYLE,
              {
                borderRadius: 24,
                overflow: 'hidden',
              },
            ]}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                  {activePreviewBeta?.title}
                </Text>
                <Text style={{ color: '#9A9AA6', fontSize: 13, marginTop: 2 }}>
                  {activePreviewBeta?.zoneName} • {activePreviewBeta?.gymName}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActivePreviewBeta(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#16161C',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Video Viewport Mock */}
            <View
              style={{
                width: '100%',
                height: 240,
                backgroundColor: '#121216',
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activePreviewBeta && (
                <Image
                  source={BETA_THUMBNAILS[activePreviewBeta.gradeRaw] || require('../assets/holds-images/v6-ripple-effect-square.jpg')}
                  style={{ width: '100%', height: '100%', opacity: 0.6 }}
                  resizeMode="cover"
                />
              )}
              <View
                style={{
                  position: 'absolute',
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(142, 124, 255, 0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#8E7CFF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                }}
              >
                <Play size={28} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
              </View>
            </View>

            {/* Modal Footer */}
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      backgroundColor: '#8E7CFF',
                      borderRadius: 8,
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                      {activePreviewBeta?.gradeRaw}
                    </Text>
                  </View>
                  <Text style={{ color: '#9A9AA6', fontSize: 13, fontWeight: '500' }}>
                    Recorded {activePreviewBeta?.date}
                  </Text>
                </View>
                <Text style={{ color: '#6EE756', fontSize: 13, fontWeight: '700' }}>
                  0:{activePreviewBeta?.durationSeconds.toString().padStart(2, '0')} HD
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActivePreviewBeta(null)}
                style={{
                  backgroundColor: '#8E7CFF',
                  height: 46,
                  borderRadius: 23,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  Close Playback
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
