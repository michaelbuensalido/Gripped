import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2, Trophy, Zap, CheckCircle2, Flame, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { GradePill } from './GradePill';
import { ScalePressable } from './ScalePressable';

export interface SessionCardProps {
  session: any;
  onDelete: (id: string, count: number) => void;
}

function formatSessionDate(ms: number) {
  const d = new Date(ms);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

function formatSessionTime(start: number, end?: number | null) {
  const s = new Date(start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (!end) return `${s} – Ongoing`;
  const e = new Date(end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${s} – ${e}`;
}

function formatDuration(start: number, end?: number | null) {
  if (!end) return 'Active';
  const durationMs = end - start;
  const totalMins = Math.floor(durationMs / 60000);
  if (totalMins === 0) {
    const s = Math.floor(durationMs / 1000);
    return `${s}s`;
  }
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const { colors, space, radius, type, shadow, gradeBand } = useTheme();
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const { weekday, day, month } = formatSessionDate(session.startTime);
  const timeRange = formatSessionTime(session.startTime, session.endTime);
  const duration = formatDuration(session.startTime, session.endTime);

  const flashCount = session.resultMix?.flash ?? 0;
  const topCount = session.resultMix?.top ?? 0;
  const attemptCount = session.resultMix?.attempt ?? 0;
  const totalMix = flashCount + topCount + attemptCount;

  const hasHardest = session.hardestLabel && session.hardestLabel !== '–';
  const stripeColor = hasHardest
    ? gradeBand(session.hardestGradeIndex ?? 0).solid
    : colors.accent;

  const badges: { id: string; label: string; color: string }[] = Array.isArray(session.badges)
    ? session.badges
    : [];

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={{
          width: 80,
          backgroundColor: colors.danger,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.lg,
          marginBottom: space.md,
          marginLeft: space.sm,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          Alert.alert(
            'Delete Session',
            `Are you sure you want to delete this session? ${session.climbsCount} climb(s) will be deleted.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => onDelete(session.id, session.climbsCount),
              },
            ]
          );
        }}
      >
        <Animated.View style={{ opacity }}>
          <Trash2 size={22} color={colors.textOnAccent} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      containerStyle={{ overflow: 'visible' }}
    >
      <ScalePressable
        haptic="light"
        activeScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Session at ${session.gymName || 'Gym'}, ${day} ${month}, ${session.climbsCount} climbs`}
        onPress={() => router.push(`/session/detail/${session.id}?variant=summary`)}
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          paddingVertical: space.md,
          paddingLeft: space.md + 6,
          paddingRight: space.md,
          marginBottom: space.md,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          position: 'relative',
          ...shadow.card,
        }}
      >
        {/* Signature 4pt Left Grade-Band Accent Bar */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 14,
            bottom: 14,
            width: 4,
            borderRadius: 2,
            backgroundColor: stripeColor,
          }}
        />

        {/* Main Row: Date Stamp + Gym & Inline Telemetry + Peak GradePill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
          }}
        >
          {/* Left: Compact Tactile Date Ticket */}
          <View
            style={{
              width: 48,
              height: 52,
              borderRadius: radius.sm,
              backgroundColor: colors.cardMuted,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                type.label,
                {
                  color: colors.textMuted,
                  fontSize: 9,
                  lineHeight: 11,
                  letterSpacing: 1.4,
                },
              ]}
            >
              {month}
            </Text>
            <Text
              style={[
                type.statSm,
                {
                  color: colors.textWhitePrimary,
                  fontSize: 19,
                  lineHeight: 23,
                  fontWeight: '700',
                },
              ]}
            >
              {day}
            </Text>
          </View>

          {/* Center: Gym Title, Time Range, and Inline Telemetry Summary */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={[
                  type.heading,
                  {
                    color: colors.textWhitePrimary,
                    fontSize: 17,
                    fontWeight: '700',
                    flex: 1,
                    marginRight: space.xs,
                  },
                ]}
                numberOfLines={1}
              >
                {session.gymName || 'Climbing Session'}
              </Text>

              {hasHardest ? (
                <GradePill gradeIndex={session.hardestGradeIndex ?? 0} label={session.hardestLabel} />
              ) : (
                <ChevronRight size={18} color={colors.textMuted} />
              )}
            </View>

            <Text
              style={[
                type.caption,
                {
                  color: colors.textMuted,
                  marginTop: 2,
                },
              ]}
              numberOfLines={1}
            >
              {weekday} · {timeRange} · {duration}
            </Text>

            {/* Compact Inline Stats Line (Distinct from Hero Bento Grid) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                marginTop: 6,
              }}
            >
              <Text style={[type.caption, { color: colors.textWhitePrimary, fontWeight: '600' }]}>
                {session.climbsCount} {session.climbsCount === 1 ? 'climb' : 'climbs'}
              </Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>·</Text>
              <Text style={[type.caption, { color: colors.accentText, fontWeight: '600' }]}>
                {session.sendsCount} {session.sendsCount === 1 ? 'send' : 'sends'}
              </Text>
              {session.flashesCount > 0 && (
                <>
                  <Text style={[type.caption, { color: colors.textMuted }]}>·</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Zap size={11} color={colors.flashText} strokeWidth={2.5} />
                    <Text style={[type.caption, { color: colors.flashText, fontWeight: '700' }]}>
                      {session.flashesCount} flash{session.flashesCount === 1 ? '' : 'es'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Optional Achievement Badges + Segmented Outcome Micro-Bar */}
        {(badges.length > 0 || totalMix > 0) && (
          <View style={{ marginTop: space.sm + 2, gap: 6 }}>
            {badges.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {badges.map((b) => {
                  const isFlashBadge = b.color === 'flash' || b.color === 'success';
                  const badgeBg = isFlashBadge ? colors.flashSoft : colors.accentSoft;
                  const badgeText = isFlashBadge ? colors.flashText : colors.accentText;
                  const BadgeIcon =
                    b.id === 'personal_best'
                      ? Trophy
                      : b.id === 'flash_day'
                      ? Zap
                      : b.id === 'project_sent'
                      ? CheckCircle2
                      : Flame;

                  return (
                    <View
                      key={b.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: badgeBg,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: radius.pill,
                      }}
                    >
                      <BadgeIcon size={10} color={badgeText} strokeWidth={2.4} />
                      <Text
                        style={[
                          type.caption,
                          {
                            color: badgeText,
                            fontSize: 10,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {b.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {totalMix > 0 && (
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  overflow: 'hidden',
                  flexDirection: 'row',
                  gap: 2,
                  backgroundColor: colors.chartGhost,
                }}
              >
                {flashCount > 0 && (
                  <View
                    style={{
                      flex: flashCount,
                      backgroundColor: colors.flash,
                      borderRadius: 2,
                    }}
                  />
                )}
                {topCount > 0 && (
                  <View
                    style={{
                      flex: topCount,
                      backgroundColor: colors.top,
                      borderRadius: 2,
                    }}
                  />
                )}
                {attemptCount > 0 && (
                  <View
                    style={{
                      flex: attemptCount,
                      backgroundColor: colors.attempt,
                      borderRadius: 2,
                      opacity: 0.65,
                    }}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </ScalePressable>
    </Swipeable>
  );
}
