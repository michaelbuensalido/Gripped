import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/useTheme';
import { GradePill } from './GradePill';

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
  if (!end) return `${s} - Ongoing`;
  const e = new Date(end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${s} - ${e}`;
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
  return `${m} min`;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const { colors, space, radius, type, shadow } = useTheme();
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const { weekday, day, month } = formatSessionDate(session.startTime);
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
          borderRadius: radius.xl,
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
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: radius.xl,
            padding: space.xl,
            marginBottom: space.lg,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.04)',
          }
        ]}
      >
        {/* Top Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.lg }}>
          <View>
            <Text style={[type.display, { color: colors.textWhitePrimary, fontSize: 24, lineHeight: 28, letterSpacing: -0.5 }]} numberOfLines={1}>
              {session.gymName}
            </Text>
            <Text style={[type.caption, { color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: 0.5 }]} numberOfLines={1}>
              {timeRange} • {duration}
            </Text>
          </View>
          
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[type.label, { color: colors.accent, fontSize: 10, letterSpacing: 2, marginBottom: 2 }]}>{month}</Text>
            <Text style={[type.display, { color: colors.textWhitePrimary, fontSize: 26, lineHeight: 28 }]}>{day}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space.lg }}>
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 2, marginBottom: 4 }]}>CLIMBS</Text>
            <Text style={[type.heading, { color: colors.textWhitePrimary, fontSize: 20 }]}>{session.climbsCount}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 2, marginBottom: 4 }]}>SENDS</Text>
            <Text style={[type.heading, { color: colors.textWhitePrimary, fontSize: 20 }]}>{session.sendsCount}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 2, marginBottom: 4 }]}>FLASHES</Text>
            <Text style={[type.heading, { color: colors.flash, fontSize: 20 }]}>{session.flashesCount}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[type.label, { color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 2, marginBottom: 4 }]}>HARDEST</Text>
            {session.hardestLabel !== '–' ? (
              <GradePill gradeIndex={session.hardestGradeIndex} label={session.hardestLabel} />
            ) : (
              <Text style={[type.heading, { color: 'rgba(255,255,255,0.3)', fontSize: 20 }]}>–</Text>
            )}
          </View>
        </View>

        {/* Thin Gradient Bar */}
        {totalMix > 0 && (
          <View style={{ marginTop: space.sm }}>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden', flexDirection: 'row' }}>
              <LinearGradient
                colors={[colors.flash, colors.top, colors.attempt]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}
