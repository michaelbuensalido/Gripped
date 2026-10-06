import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { ProjectCard } from '../../components/ui/ProjectCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { CreateProjectModal } from '../../components/project/CreateProjectModal';
import { useRichProjects } from '../../db/hooks';
import { triggerHaptic } from '../../utils/haptics';

export default function GymDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decodedId = decodeURIComponent(id || '');
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  const projects = useRichProjects().filter(p => p.gymName === decodedId);
  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const sentProjects = projects.filter(p => p.status === 'sent');

  const handleOpenAddProject = () => {
    triggerHaptic('light');
    setIsAddProjectOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgTexture }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: Math.max(insets.top, 20), paddingBottom: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: space.sm }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: space.xs, marginLeft: -space.xs }}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[type.display, { color: colors.text, fontSize: 22, marginLeft: space.sm }]} numberOfLines={1}>
            {decodedId}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenAddProject}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accent,
            paddingHorizontal: space.md,
            paddingVertical: 7,
            borderRadius: radius.pill,
          }}
        >
          <Plus size={16} color={colors.textOnAccent} style={{ marginRight: 4 }} />
          <Text style={[type.label, { color: colors.textOnAccent, fontWeight: '700' }]}>Project</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 130,
          paddingHorizontal: space.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md, marginTop: space.xl }}>
          <Text style={[type.label, { color: colors.textMuted }]}>ACTIVE PROJECTS</Text>
        </View>

        {activeProjects.length === 0 ? (
          <EmptyState 
            title="No active projects"
            body={`Start a new project to track your burns and beta at ${decodedId}.`}
            cta={
              <TouchableOpacity
                onPress={handleOpenAddProject}
                style={{
                  backgroundColor: colors.accent,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  marginTop: space.sm,
                }}
              >
                <Text style={[type.heading, { color: colors.textOnAccent, fontSize: 15 }]}>
                  Add Project to this Gym
                </Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <View style={{ gap: space.md }}>
            {activeProjects.map(p => (
              <ProjectCard 
                key={p.id} 
                project={p} 
              />
            ))}
          </View>
        )}

        {sentProjects.length > 0 && (
          <>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.md, marginTop: space['2xl'] }]}>COMPLETED</Text>
            <View style={{ gap: space.md }}>
              {sentProjects.map(p => (
                <ProjectCard 
                  key={p.id} 
                  project={p} 
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* In-place project creation modal */}
      <CreateProjectModal
        visible={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        defaultGym={decodedId}
      />
    </View>
  );
}
