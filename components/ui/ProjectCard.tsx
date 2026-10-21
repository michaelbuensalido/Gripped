import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Archive, Plus, RotateCcw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { GradePill } from './GradePill';
import { ScalePressable } from './ScalePressable';

function getRelativeTime(timestamp: number | null) {
  if (!timestamp) return 'Not yet';
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

const CUTOUT_HOLDS_BY_TYPE: Record<string, any> = {
  jug: require('../../assets/holds-images/yellow_jug.png'),
  jugs: require('../../assets/holds-images/yellow_jug.png'),
  pinch: require('../../assets/holds-images/pink_pinch.png'),
  pinches: require('../../assets/holds-images/pink_pinch.png'),
  sloper: require('../../assets/holds-images/v6-ripple-effect-square.png'),
  slopers: require('../../assets/holds-images/v6-ripple-effect-square.png'),
  crimp: require('../../assets/holds-images/v8-poly-edge.png'),
  crimps: require('../../assets/holds-images/v8-poly-edge.png'),
  pocket: require('../../assets/holds-images/v7-slab-rlise.png'),
  pockets: require('../../assets/holds-images/v7-slab-rlise.png'),
  volume: require('../../assets/holds-images/v6-orange-facet.png'),
  volumes: require('../../assets/holds-images/v6-orange-facet.png'),
};

const CUTOUT_HOLD_ROTATION = [
  require('../../assets/holds-images/yellow_jug.png'),
  require('../../assets/holds-images/pink_pinch.png'),
  require('../../assets/holds-images/v6-ripple-effect-square.png'),
  require('../../assets/holds-images/v6-orange-facet.png'),
  require('../../assets/holds-images/v7-slab-rlise.png'),
  require('../../assets/holds-images/v7-kars-sloper.png'),
  require('../../assets/holds-images/v8-poly-edge.png'),
];

function getProjectHoldSource(project: any) {
  const holdKey = (project?.holdType || '').toLowerCase();
  if (holdKey && CUTOUT_HOLDS_BY_TYPE[holdKey]) {
    return CUTOUT_HOLDS_BY_TYPE[holdKey];
  }
  const gradeIdx = project?.normalizedDifficulty ?? project?.grade_index ?? 0;
  return CUTOUT_HOLD_ROTATION[Math.abs(gradeIdx) % CUTOUT_HOLD_ROTATION.length];
}

export function ProjectCard({ 
  project, 
  onLogAttempt,
  onArchive,
  onRestore,
  style,
  disableSwipe,
}: { 
  project: any; 
  onLogAttempt?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  style?: any;
  disableSwipe?: boolean;
}) {
  const { colors, space, radius, type, gradeBand } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const router = useRouter();
  const isArchived = project?.status === 'abandoned';

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    if (!onLogAttempt) return null;
    const opacity = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={{ width: 80, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', borderRadius: radius.lg }}
        onPress={() => { triggerHaptic('medium'); swipeableRef.current?.close(); onLogAttempt?.(); }}
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

    if (onRestore || isArchived) {
      return (
        <TouchableOpacity
          style={{ width: 80, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', borderRadius: radius.lg, marginLeft: space.sm }}
          onPress={() => { triggerHaptic('medium'); swipeableRef.current?.close(); onRestore?.(); }}
          accessibilityRole="button"
          accessibilityLabel="Restore project"
        >
          <Animated.View style={{ opacity, alignItems: 'center', gap: 4 }}>
            <RotateCcw size={22} color={colors.textOnAccent} />
            <Text style={{ color: colors.textOnAccent, fontSize: 11, fontWeight: '600' }}>Restore</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    }

    if (!onArchive) return null;

    return (
      <TouchableOpacity
        style={{ width: 80, backgroundColor: colors.cardMuted, justifyContent: 'center', alignItems: 'center', borderRadius: radius.lg, marginLeft: space.sm }}
        onPress={() => { triggerHaptic('light'); swipeableRef.current?.close(); onArchive?.(); }}
        accessibilityRole="button"
        accessibilityLabel="Archive project"
      >
        <Animated.View style={{ opacity, alignItems: 'center', gap: 4 }}>
          <Archive size={22} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '500' }}>Archive</Text>
        </Animated.View>
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
    <ScalePressable
      haptic="light"
      activeScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Project ${project.title}, grade ${project.gradeRaw ?? project.grade_raw ?? 'unknown'}`}
      onPress={() => router.push(`/project/${project.id}` as any)}
      style={[{ 
        backgroundColor: colors.materialBase, 
        borderRadius: radius.lg, 
        borderWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 140,
        justifyContent: 'center',
        padding: space.lg,
      }, style]}
      testID={`project-card-${project.title.replace(/\s+/g, '-')}`}
    >
      {/* 4px left accent stripe, inset 14px from top and bottom */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 14,
          bottom: 14,
          width: 4,
          borderRadius: 2,
          backgroundColor: band.solid,
          zIndex: 10,
        }}
      />

      {/* Edge-to-edge background */}
      {project.mediaUri ? (
        <>
          <Image source={{ uri: project.mediaUri }} style={[StyleSheet.absoluteFill, { opacity: 0.6 }]} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} pointerEvents="none" />
        </>
      ) : (
        <View style={{ position: 'absolute', top: -20, right: -20 }} pointerEvents="none">
          <Image 
            source={getProjectHoldSource(project)} 
            style={{
              width: 140,
              height: 140,
              opacity: 0.72,
            }}
            resizeMode="contain"
          />
        </View>
      )}

      <View style={{ zIndex: 5, paddingLeft: space.xs, maxWidth: '90%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.sm }}>
          <GradePill gradeIndex={project.normalizedDifficulty ?? project.grade_index ?? 0} label={project.gradeRaw ?? project.grade_raw ?? '—'} />
          {isArchived && (
            <View style={{ backgroundColor: colors.cardMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border }}>
              <Text style={[type.label, { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>ARCHIVED</Text>
            </View>
          )}
        </View>
        <Text style={[type.title, { color: colors.textWhitePrimary, marginBottom: 2 }]} numberOfLines={1}>{project.title}</Text>
        {subtitle ? (
          <Text style={[type.caption, { color: colors.textWhiteSecondary, marginBottom: space.sm }]} numberOfLines={1}>{subtitle}</Text>
        ) : <View style={{ marginBottom: space.sm }} />}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {project.attempts > 0 ? (
            <Text style={[type.caption, { color: colors.textWhiteMuted, flex: 1 }]} numberOfLines={1}>
              {`${project.attempts} burns`}
              {project.highWaterMarkMoves ? ` · ${project.highWaterMarkMoves} moves` : ''}
              {project.lastTriedAt ? ` · ${getRelativeTime(project.lastTriedAt)}` : ''}
            </Text>
          ) : (
            <Text style={[type.caption, { color: colors.textWhiteMuted, flex: 1 }]}>No attempts yet</Text>
          )}

          {onRestore ? (
            <ScalePressable
              onPress={onRestore}
              haptic="medium"
              activeScale={0.95}
              style={{
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: colors.accent,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: space.md,
              }}
              accessibilityRole="button"
              accessibilityLabel="Restore project"
            >
              <Text style={[type.control, { color: colors.textOnAccent, fontWeight: '600' }]}>Restore</Text>
            </ScalePressable>
          ) : onLogAttempt ? (
            <ScalePressable
              onPress={onLogAttempt}
              haptic="medium"
              activeScale={0.95}
              style={{
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: colors.accent,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: space.md,
              }}
              accessibilityRole="button"
              accessibilityLabel="Log Attempt"
            >
              <Text style={[type.control, { color: colors.textWhitePrimary }]}>Attempt</Text>
            </ScalePressable>
          ) : null}
        </View>
      </View>
    </ScalePressable>
  );

  if (disableSwipe) {
    return cardContent;
  }

  return (
    <Swipeable ref={swipeableRef} renderLeftActions={renderLeftActions} renderRightActions={renderRightActions} overshootLeft={false} overshootRight={false}>
      {cardContent}
    </Swipeable>
  );
}
