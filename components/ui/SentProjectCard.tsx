import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { GradePill } from './GradePill';

export function SentProjectCard({ project, onPress }: { project: any; onPress: () => void }) {
  const { colors, space, radius, type, shadow } = useTheme();

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg }, shadow.card]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
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
        <View style={{ backgroundColor: colors.flash, paddingHorizontal: 6, paddingVertical: 4, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Trophy size={12} color={colors.textOnAccent} />
          <Text style={[type.caption, { color: colors.textOnAccent, fontWeight: '700' }]}>SENT</Text>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: space.md }}>
        <Text style={[type.body, { color: colors.text }]}>Sent in {project.attempts || 1} burns</Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {new Date(project.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
