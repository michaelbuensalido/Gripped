import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { EmptyState } from '../components/ui/EmptyState';
import { ProjectCard } from '../components/ui/ProjectCard';
import { FilterChip } from '../components/ui/FilterChip';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { useProjects } from '../db/hooks';
import { useSessionStore } from '../store/sessionStore';
import { triggerHaptic } from '../utils/haptics';
import { useTheme } from '../theme/useTheme';

export default function ProjectsScreen() {
  const router = useRouter();
  const { colors, space, shadow } = useTheme();
  const projects = useProjects() || [];
  
  const setActiveProjectTarget = useSessionStore((s) => s.setActiveProjectTarget);
  const [activeTab, setActiveTab] = useState<'in_progress' | 'sent'>('in_progress');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => p.status === activeTab);
  }, [projects, activeTab]);

  const handleStartSiege = (project: any) => {
    triggerHaptic('heavy');
    setActiveProjectTarget(project);
    router.push('/session/active');
  };

  const handleAddProject = () => {
    triggerHaptic('medium');
    router.push('/');
  };

  return (
    <Screen 
      title="Projects" 
      subtitle="What you're working on next" 
      scroll 
    >
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
        <FilterChip 
          label={`In Progress (${projects.filter(p => p.status === 'in_progress').length})`} 
          active={activeTab === 'in_progress'} 
          onPress={() => { triggerHaptic('light'); setActiveTab('in_progress'); }} 
        />
        <FilterChip 
          label={`Sent (${projects.filter(p => p.status === 'sent').length})`} 
          active={activeTab === 'sent'} 
          onPress={() => { triggerHaptic('light'); setActiveTab('sent'); }} 
        />
      </View>

      <View style={{ gap: space.sm, paddingBottom: 100 }}>
        {filteredProjects.length === 0 ? (
          <EmptyState 
            icon={<Plus size={24} />} 
            title={activeTab === 'in_progress' ? 'No active projects' : 'No sent projects'} 
            body="No projects yet. Make one after your next attempt." cta={<PrimaryButton label="Start a Session" onPress={handleAddProject} />} 
          />
        ) : (
          filteredProjects.map((p) => (
            <ProjectCard 
              key={p.id} 
              project={p} 
              onLogAttempt={() => handleStartSiege(p)} 
            />
          ))
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        onPress={handleAddProject}
        activeOpacity={0.8}
        style={[
          {
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          },
          shadow.floating
        ]}
      >
        <Plus size={24} color={colors.textOnAccent} />
      </TouchableOpacity>
    </Screen>
  );
}
