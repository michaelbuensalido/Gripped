import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { GradePill } from './GradePill';
import { SessionBadge } from '../../utils/sessionBadges';

export interface SessionCardProps {
  session: {
    id: string;
    gymName: string;
    startTime: number;
    endTime: number;
    notes?: string;
    effort?: number;
    climbsCount: number;
    sendsCount: number;
    flashesCount: number;
    hardestGradeIndex: number;
    hardestLabel: string;
    badges: SessionBadge[];
    resultMix: { flash: number; top: number; attempt: number };
  };
  onDelete: (id: string, climbsCount: number) => void;
}

function formatSessionDate(ms: number) {
  const d = new Date(ms);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  return { weekday, day };
}

function formatSessionTime(startMs: number, endMs: number) {
  const s = new Date(startMs);
  const e = endMs ? new Date(endMs) : s;
  
  const h1 = s.getHours() % 12 || 12;
  const m1 = s.getMinutes().toString().padStart(2, '0');
  const a1 = s.getHours() >= 12 ? 'PM' : 'AM';
  
  const h2 = e.getHours() % 12 || 12;
  const m2 = e.getMinutes().toString().padStart(2, '0');
  const a2 = e.getHours() >= 12 ? 'PM' : 'AM';
  
  if (a1 === a2) {
    return `${h1}:${m1}-${h2}:${m2} ${a2}`;
  }
  return `${h1}:${m1} ${a1} - ${h2}:${m2} ${a2}`;
}

function formatDuration(startMs: number, endMs: number) {
  if (!endMs) return '<1 min';
  const durationMs = endMs - startMs;
  if (durationMs < 60000) return '<1 min';
  const totalMins = Math.floor(durationMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const { colors, space, radius, type, shadow } = useTheme();
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const { weekday, day } = formatSessionDate(session.startTime);
  const timeRange = formatSessionTime(session.startTime, session.endTime);
  const duration = formatDuration(session.startTime, session.endTime);
  const totalMix = session.resultMix.flash + session.resultMix.top + session.resultMix.attempt;

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
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
          marginBottom: space.lg,
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
        accessibilityRole="button"
        accessibilityLabel="Delete session"
      >
        <Animated.View style={{ opacity }}>
          <Trash2 size={24} color={colors.textOnAccent} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} containerStyle={{ overflow: 'visible', paddingBottom: 4 }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/session/detail/${session.id}?variant=summary`)}
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: space.md,
            marginBottom: space.lg,
          },
          shadow.card,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Session at ${session.gymName}`}
      >
        <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.sm }}>
          {/* Date Badge */}
          <View style={{
            backgroundColor: colors.cardMuted,
            borderRadius: radius.md,
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={[type.label, { color: colors.textMuted, fontSize: 10, lineHeight: 12, marginBottom: 2 }]}>{weekday}</Text>
            <Text style={[type.heading, { color: colors.text }]}>{day}</Text>
          </View>
          
          {/* Header Info */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[type.heading, { color: colors.text }]} numberOfLines={1}>{session.gymName}</Text>
            <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
              {timeRange} · {duration}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: space.lg, marginBottom: space.md }}>
          <View>
            <Text style={[type.label, { color: colors.textMuted }]}>Climbs</Text>
            <Text style={[type.heading, { color: colors.text, marginTop: 2 }]}>{session.climbsCount}</Text>
          </View>
          <View>
            <Text style={[type.label, { color: colors.textMuted }]}>Sends</Text>
            <Text style={[type.heading, { color: colors.text, marginTop: 2 }]}>{session.sendsCount}</Text>
          </View>
          <View>
            <Text style={[type.label, { color: colors.textMuted }]}>Flashes</Text>
            <Text style={[type.heading, { color: colors.text, marginTop: 2 }]}>{session.flashesCount}</Text>
          </View>
          <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: 4 }]}>Hardest</Text>
            {session.hardestLabel !== '–' ? (
              <GradePill gradeIndex={session.hardestGradeIndex} label={session.hardestLabel} />
            ) : (
              <Text style={[type.heading, { color: colors.text }]}>–</Text>
            )}
          </View>
        </View>

        {/* Result mix bar with min width and legend */}
        {totalMix > 0 && (
          <View style={{ marginBottom: space.md }} accessible={true} accessibilityLabel={`Result mix: ${session.resultMix.flash} flashes, ${session.resultMix.top} tops, ${session.resultMix.attempt} attempts`}>
            <View style={{ flexDirection: 'row', height: 6, borderRadius: radius.pill, overflow: 'hidden', gap: 1 }}>
              {session.resultMix.flash > 0 && <View style={{ flex: Math.max(session.resultMix.flash, totalMix * 0.1), backgroundColor: colors.flash }} />}
              {session.resultMix.top > 0 && <View style={{ flex: Math.max(session.resultMix.top, totalMix * 0.1), backgroundColor: colors.top }} />}
              {session.resultMix.attempt > 0 && <View style={{ flex: Math.max(session.resultMix.attempt, totalMix * 0.1), backgroundColor: colors.attempt }} />}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: 4 }}>
              {session.resultMix.flash > 0 && <Text style={[type.caption, { color: colors.textMuted, fontSize: 10 }]}>{session.resultMix.flash} Flash</Text>}
              {session.resultMix.top > 0 && <Text style={[type.caption, { color: colors.textMuted, fontSize: 10 }]}>{session.resultMix.top} Top</Text>}
              {session.resultMix.attempt > 0 && <Text style={[type.caption, { color: colors.textMuted, fontSize: 10 }]}>{session.resultMix.attempt} Attempt</Text>}
            </View>
          </View>
        )}

        {/* Badges */}
        {session.badges && session.badges.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: (session.effort || session.notes) ? space.md : 0 }}>
            {session.badges.map(b => (
              <View key={b.id} style={{ backgroundColor: colors[`${b.color}Soft`], paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                <Text style={[type.caption, { color: colors[`${b.color}Text`], fontWeight: '600' }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Effort & Notes */}
        {(session.effort || session.notes) && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            {session.effort ? (
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <View key={n} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: n <= session.effort! ? colors.accent : colors.cardMuted }} />
                ))}
              </View>
            ) : null}
            {session.notes && (
              <Text style={[type.body, { color: colors.textMuted, flex: 1 }]} numberOfLines={1}>
                {session.notes}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}
