import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Archive, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/useTheme';
import { GradePill } from './GradePill';
import { Chip } from './Chip';
import { SecondaryButton } from './SecondaryButton';

function getRelativeTime(timestamp: number | null) {
  if (!timestamp) return 'Not yet';
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function Sparkline({ data }: { data: number[] }) {
  const { colors, radius } = useTheme();
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 24, gap: 2 }}>
      {data.map((val, i) => (
        <View 
          key={i} 
          style={{ 
            width: 4, 
            height: Math.max(4, (val / max) * 24), 
            backgroundColor: colors.accent,
            borderRadius: radius.sm 
          }} 
        />
      ))}
    </View>
  );
}

export function ProjectCard({ 
  project, 
  onLogAttempt,
  onArchive,
  style,
}: { 
  project: any; 
  onLogAttempt?: () => void;
  onArchive?: () => void;
  style?: any;
}) {
  const { colors, space, radius, type, shadow, gradeBand } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const router = useRouter();

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const opacity = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={{
          width: 80,
          backgroundColor: colors.accent,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.lg,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          onLogAttempt?.();
        }}
        accessibilityRole="button"
        accessibilityLabel="Log attempt"
      >
        <Animated.View style={{ opacity }}>
          <Plus size={24} color={colors.textOnAccent} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

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
          backgroundColor: colors.cardMuted,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.lg,
          marginLeft: space.sm,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          onArchive?.();
        }}
        accessibilityRole="button"
        accessibilityLabel="Archive project"
      >
        <Animated.View style={{ opacity }}>
          <Archive size={24} color={colors.text} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Format Line 2: Gym · Angle · Hold
  const tags = [];
  if (project.gymName) tags.push(project.gymName);
  if (project.wallAngle) tags.push(project.wallAngle.charAt(0).toUpperCase() + project.wallAngle.slice(1));
  if (project.holdType) tags.push(project.holdType.charAt(0).toUpperCase() + project.holdType.slice(1));
  const subtitle = tags.join(' · ');

  // Informative status chip
  let statusChip = null;
  if (project.statusChip && project.statusChip !== 'Not started') {
    statusChip = project.statusChip;
  }

  const stripeColor = gradeBand(project.normalizedDifficulty ?? project.grade_index ?? 0).solid;

  const cardContent = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/project/${project.id}` as any)}
      style={[{ backgroundColor: colors.card, borderRadius: radius.lg, paddingLeft: space.md + 8, paddingRight: space.md, paddingTop: space.md, paddingBottom: space.md, overflow: 'hidden' }, shadow.card, style]}
      testID={`project-card-${project.title.replace(/\\s+/g, '-')}`}
    >
      {/* Grade-band left stripe */}
      <View style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: radius.lg,
        borderBottomLeftRadius: radius.lg,
        backgroundColor: stripeColor,
      }} />

      {/* Row 1 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.sm, gap: space.md }}>
        <GradePill gradeIndex={project.normalizedDifficulty ?? project.grade_index ?? 0} label={project.gradeRaw ?? project.grade_raw ?? '—'} />
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { color: colors.text }]} numberOfLines={1}>
            {project.title}
          </Text>
        </View>
        {statusChip && (
          <View style={{ backgroundColor: colors.cardMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm }}>
            <Text style={[type.caption, { color: colors.text }]}>{statusChip}</Text>
          </View>
        )}
      </View>

      {/* Row 2 */}
      {subtitle ? (
        <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.md }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : <View style={{ marginBottom: space.md }} />}

      {/* Row 3 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {project.attempts > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: space.sm }}>
            <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
              {`${project.attempts} burns`}
              {project.highWaterMarkMoves ? ` · ${project.highWaterMarkMoves} moves linked` : ''}
              {project.lastTriedAt ? ` · ${getRelativeTime(project.lastTriedAt)}` : ''}
            </Text>
          </View>
        ) : (
          <Text style={[type.caption, { color: colors.textMuted, flex: 1 }]}>No attempts yet</Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          {project.burnsPerSession && project.burnsPerSession.length > 0 && (
            <Sparkline data={project.burnsPerSession} />
          )}
          {onLogAttempt && (
            <TouchableOpacity
              onPress={onLogAttempt}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: colors.accentSoft, borderRadius: radius.sm }}
            >
              <Plus size={14} color={colors.accentText} />
              <Text style={[type.label, { color: colors.accentText, marginTop: 1 }]}>Log attempt</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Swipeable 
      ref={swipeableRef}
      renderLeftActions={renderLeftActions} 
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      {cardContent}
    </Swipeable>
  );
}
