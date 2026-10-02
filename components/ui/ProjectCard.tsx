import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Archive, Plus } from 'lucide-react-native';
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
  onArchive 
}: { 
  project: any; 
  onLogAttempt: () => void;
  onArchive: () => void;
}) {
  const { colors, space, radius, type, shadow } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);

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
          marginBottom: space.lg,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          onLogAttempt();
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
          marginBottom: space.lg,
          marginLeft: space.sm,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          onArchive();
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

  return (
    <Swipeable 
      ref={swipeableRef}
      renderLeftActions={renderLeftActions} 
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <View testID={`project-card-${project.title.replace(/\s+/g, '-')}`} style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg }, shadow.card]}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md, gap: space.md }}>
          <GradePill gradeIndex={project.normalizedDifficulty} label={project.gradeRaw} />
          <View style={{ flex: 1 }}>
            <Text style={[type.heading, { color: colors.text }]} numberOfLines={1}>
              {project.title}
            </Text>
            {project.gymName && (
              <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
                {project.gymName}
              </Text>
            )}
          </View>
          <View style={{ backgroundColor: colors.cardMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm }}>
            <Text style={[type.caption, { color: colors.text }]}>{project.statusChip}</Text>
          </View>
        </View>

        {/* Tags */}
        {(project.wallAngle || project.holdType) && (
          <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
            {project.wallAngle && <Chip label={project.wallAngle} />}
            {project.holdType && <Chip label={project.holdType} />}
          </View>
        )}

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: space.lg, marginBottom: space.md, alignItems: 'flex-end' }}>
          <View>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>BURNS</Text>
            <Text style={[type.heading, { color: colors.text }]}>{project.attempts || 0}</Text>
          </View>
          <View>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>HIGH-WATER</Text>
            <Text style={[type.heading, { color: colors.text }]}>
              {project.highWaterMarkMoves ? `${project.highWaterMarkMoves} moves` : 'None'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>LAST TRIED</Text>
            <Text style={[type.body, { color: colors.text }]}>{getRelativeTime(project.lastTriedAt)}</Text>
          </View>
          {project.burnsPerSession && project.burnsPerSession.length > 0 && (
            <Sparkline data={project.burnsPerSession} />
          )}
        </View>

        {/* Notes */}
        {project.microBeta && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7} style={{ marginBottom: space.md }}>
            <Text style={[type.body, { color: colors.textMuted }]} numberOfLines={expanded ? undefined : 2}>
              {project.microBeta}
            </Text>
          </TouchableOpacity>
        )}

        {/* Action */}
        <View style={{ alignItems: 'flex-start', marginTop: space.sm }}>
          <SecondaryButton label="Log Attempt" onPress={onLogAttempt} />
        </View>
      </View>
    </Swipeable>
  );
}
