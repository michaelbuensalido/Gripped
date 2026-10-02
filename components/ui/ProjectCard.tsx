import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Archive, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { GradePill } from './GradePill';

function getRelativeTime(timestamp: number | null) {
  if (!timestamp) return 'Not yet';
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function HoldPlaceholder({ color }: { color: string }) {
  return (
    <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A20' }}>
      <Svg width={80} height={80} viewBox="0 0 100 100">
        <Path
          d="M80 30 C90 20, 100 40, 95 60 C90 80, 70 90, 50 85 C30 80, 20 60, 25 40 C30 20, 70 40, 80 30Z"
          fill={color}
          opacity={0.15}
        />
      </Svg>
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
  const { colors, space, radius, type, gradeBand } = useTheme();
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
        style={{ width: 80, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', borderRadius: radius.lg }}
        onPress={() => { swipeableRef.current?.close(); onLogAttempt?.(); }}
      >
        <Animated.View style={{ opacity }}><Plus size={24} color={colors.textOnAccent} /></Animated.View>
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
        style={{ width: 80, backgroundColor: colors.cardMuted, justifyContent: 'center', alignItems: 'center', borderRadius: radius.lg, marginLeft: space.sm }}
        onPress={() => { swipeableRef.current?.close(); onArchive?.(); }}
      >
        <Animated.View style={{ opacity }}><Archive size={24} color={colors.text} /></Animated.View>
      </TouchableOpacity>
    );
  };

  const tags = [];
  if (project.gymName) tags.push(project.gymName);
  if (project.wallAngle) tags.push(project.wallAngle.charAt(0).toUpperCase() + project.wallAngle.slice(1));
  if (project.holdType) tags.push(project.holdType.charAt(0).toUpperCase() + project.holdType.slice(1));
  const subtitle = tags.join(' · ');

  const band = gradeBand(project.normalizedDifficulty ?? project.grade_index ?? 0);

  const cardContent = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/project/${project.id}` as any)}
      style={[{ 
        backgroundColor: colors.card, 
        borderRadius: radius.lg, 
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }, style]}
      testID={`project-card-${project.title.replace(/\s+/g, '-')}`}
    >
      <View style={{ height: 120, width: '100%', backgroundColor: colors.cardMuted, position: 'relative' }}>
        {project.mediaUri ? (
          <Image source={{ uri: project.mediaUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <HoldPlaceholder color={band.solid} />
        )}
        <View style={{ position: 'absolute', top: space.sm, left: space.sm }}>
          <GradePill gradeIndex={project.normalizedDifficulty ?? project.grade_index ?? 0} label={project.gradeRaw ?? project.grade_raw ?? '—'} />
        </View>
      </View>

      <View style={{ padding: space.md }}>
        <Text style={[type.title, { color: colors.text, marginBottom: 2 }]} numberOfLines={1}>{project.title}</Text>
        {subtitle ? (
          <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.sm }]} numberOfLines={1}>{subtitle}</Text>
        ) : <View style={{ marginBottom: space.sm }} />}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {project.attempts > 0 ? (
            <Text style={[type.caption, { color: colors.textMuted, flex: 1 }]} numberOfLines={1}>
              {`${project.attempts} burns`}
              {project.highWaterMarkMoves ? ` · ${project.highWaterMarkMoves} moves linked` : ''}
              {project.lastTriedAt ? ` · ${getRelativeTime(project.lastTriedAt)}` : ''}
            </Text>
          ) : (
            <Text style={[type.caption, { color: colors.textMuted, flex: 1 }]}>No attempts yet</Text>
          )}

          {onLogAttempt && (
            <TouchableOpacity
              onPress={onLogAttempt}
              style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.accent, borderRadius: radius.md }}
            >
              <Text style={[type.control, { color: colors.textOnAccent }]}>Attempt</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Swipeable ref={swipeableRef} renderLeftActions={renderLeftActions} renderRightActions={renderRightActions} overshootLeft={false} overshootRight={false}>
      {cardContent}
    </Swipeable>
  );
}
