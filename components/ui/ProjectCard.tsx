import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { GradePill } from './GradePill';
import { Chip } from './Chip';
import { SecondaryButton } from './SecondaryButton';

export function ProjectCard({ project, onLogAttempt }: { project: any; onLogAttempt: () => void }) {
  const { colors, space, radius, type, shadow } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg }, shadow.card]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.md, gap: space.sm }}>
        <GradePill gradeIndex={project.normalizedDifficulty} label={project.gradeRaw} />
        <Text style={[type.heading, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {project.title}
        </Text>
      </View>

      {/* Tags */}
      {(project.wallAngle || project.holdType) && (
        <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
          {project.wallAngle && <Chip label={project.wallAngle} />}
          {project.holdType && <Chip label={project.holdType} />}
        </View>
      )}

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: space.lg, marginBottom: space.md }}>
        <View>
          <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>BURNS</Text>
          <Text style={[type.heading, { color: colors.text }]}>{project.attempts || 0}</Text>
        </View>
        <View>
          <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>HIGH-WATER MARK</Text>
          <Text style={[type.heading, { color: colors.text }]}>
            {project.highWaterMarkMoves ? `${project.highWaterMarkMoves} moves linked` : 'None yet'}
          </Text>
        </View>
      </View>

      {/* Micro-beta note */}
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
  );
}
