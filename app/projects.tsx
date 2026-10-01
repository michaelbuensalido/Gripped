import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Text, TextInput, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { EmptyState } from '../components/ui/EmptyState';
import { ProjectCard } from '../components/ui/ProjectCard';
import { FilterChip } from '../components/ui/FilterChip';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { LogSheet } from '../components/session/LogSheet';
import { StartSessionSheet } from '../components/session/StartSessionSheet';
import { useProjects, useActiveSession, useAllSessions } from '../db/hooks';
import { useSessionActions } from '../hooks/useSessionActions';
import { insertProject, insertAttempt, updateProjectStatus, gradeToNumeric, getActiveSession } from '../db/queries';
import { useSessionStore } from '../store/sessionStore';
import { triggerHaptic } from '../utils/haptics';
import { useTheme } from '../theme/useTheme';
import { v4 as uuid } from 'uuid';

const WALL_ANGLES = [
  { key: 'slab', label: 'Slab' },
  { key: 'vertical', label: 'Vert' },
  { key: 'overhang', label: 'Overhang' },
  { key: 'roof', label: 'Roof/Cave' },
];

const HOLD_TYPES = [
  { key: 'crimps', label: 'Crimps' },
  { key: 'slopers', label: 'Slopers' },
  { key: 'pinches', label: 'Pinches' },
  { key: 'pockets', label: 'Pockets' },
  { key: 'volumes', label: 'Volumes' },
];

const GRADES = ['V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13'];

export default function ProjectsScreen() {
  const router = useRouter();
  const { colors, space, shadow, radius, type } = useTheme();
  
  const projects = useProjects() || [];
  const activeSession = useActiveSession();
  const sessions = useAllSessions();
  const lastGym = useMemo(() => sessions.length > 0 ? sessions[0].gymName : 'Local Gym', [sessions]);

  const [activeTab, setActiveTab] = useState<'in_progress' | 'sent'>('in_progress');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStartSessionSheetOpen, setIsStartSessionSheetOpen] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  
  // Add Project state
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState(''); 
  const [newAngle, setNewAngle] = useState('overhang');
  const [newHoldType, setNewHoldType] = useState('crimps');
  const [newTotalMoves, setNewTotalMoves] = useState('12');
  const [newBeta, setNewBeta] = useState('');

  // Start Session state
  const [newGymName, setNewGymName] = useState('Local Gym');
  useEffect(() => {
    if (isStartSessionSheetOpen) setNewGymName(lastGym);
  }, [isStartSessionSheetOpen, lastGym]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => p.status === activeTab);
  }, [projects, activeTab]);

  const handleStartSiege = (project: any) => {
    triggerHaptic('heavy');
    setSelectedProject(project);
    if (activeSession) {
      setIsLogSheetOpen(true);
    } else {
      setIsStartSessionSheetOpen(true);
    }
  };

  const { startOrResume } = useSessionActions();
  const handleCreateSessionAndLog = (gymName: string) => {
    startOrResume(gymName);
    setIsStartSessionSheetOpen(false);
    setTimeout(() => setIsLogSheetOpen(true), 100);
  };


  const handleSaveLog = (grade: string, result: any, attempts: number, notes: string) => {
    if (!selectedProject) return;

    const active = getActiveSession();
    if (!active) return;

    insertAttempt({
      id: uuid(),
      sessionId: active.id,
      projectId: selectedProject.id,
      gradeRaw: grade,
      normalizedDifficulty: gradeToNumeric(grade),
      wallAngle: selectedProject.wallAngle,
      holdType: selectedProject.holdType,
      outcome: result,
      attemptNumber: attempts,
      timestamp: Date.now(),
      failureReason: null,
      notes: notes,
    });

    if (result === 'send' || result === 'top' || result === 'flash') {
      updateProjectStatus(selectedProject.id, 'sent');
    }

    triggerHaptic('success');
    setIsLogSheetOpen(false);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a project name');
      return;
    }
    if (!newGrade) {
      Alert.alert('Required', 'Please select a target grade');
      return;
    }

    const total = parseInt(newTotalMoves, 10);
    insertProject({
      id: uuid(),
      title: newTitle.trim(),
      gradeRaw: newGrade,
      normalizedDifficulty: parseInt(newGrade.replace('V', ''), 10) || 0,
      wallAngle: newAngle,
      holdType: newHoldType,
      status: 'in_progress',
      highWaterMarkMoves: 0,
      totalMoves: isNaN(total) || total <= 0 ? 12 : total,
      microBeta: newBeta.trim() || null,
      mediaUri: null,
    });

    triggerHaptic('medium');
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewGrade('');
    setNewBeta('');
    setNewTotalMoves('12');
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

      <View style={{ gap: space.sm, paddingBottom: 176 }}>
        {filteredProjects.length === 0 ? (
          <EmptyState 
            icon={<Plus size={24} />} 
            title={activeTab === 'in_progress' ? 'No active projects' : 'No sent projects'} 
            body="No projects yet. Make one after your next attempt." 
            cta={<PrimaryButton label="Add Project" onPress={() => setIsAddModalOpen(true)} />} 
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
        testID="add-project-fab"
        onPress={() => {
          triggerHaptic('light');
          setIsAddModalOpen(true);
        }}
        activeOpacity={0.8}
        style={[
          {
            position: 'absolute',
            bottom: 104,
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

      {/* Add Project Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent onRequestClose={() => setIsAddModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, maxHeight: '88%' }}>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
              <View>
                <Text style={type.title}>New Project</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>Add a project to your list</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)} style={{ padding: space.sm, backgroundColor: colors.card, borderRadius: radius.pill }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Project Name</Text>
              <TextInput testID="project-nickname-input" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Cave Roof V6" placeholderTextColor={colors.textMuted} style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.lg, color: colors.text }, type.body]} />

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Target Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.lg }}>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {GRADES.map(g => (
                    <View key={g} testID={`grade-chip-${g}`}>
                      <FilterChip label={g} active={newGrade === g} onPress={() => setNewGrade(g)} />
                    </View>
                  ))}
                </View>
              </ScrollView>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Wall Angle</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {WALL_ANGLES.map(a => (
                  <FilterChip key={a.key} label={a.label} active={newAngle === a.key} onPress={() => setNewAngle(a.key)} />
                ))}
              </View>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Hold Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {HOLD_TYPES.map(h => (
                  <FilterChip key={h.key} label={h.label} active={newHoldType === h.key} onPress={() => setNewHoldType(h.key)} />
                ))}
              </View>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Total Moves</Text>
              <TextInput value={newTotalMoves} onChangeText={setNewTotalMoves} keyboardType="number-pad" placeholder="12" placeholderTextColor={colors.textMuted} style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.lg, color: colors.text }, type.body]} />

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Micro-Beta Notes (Optional)</Text>
              <TextInput value={newBeta} onChangeText={setNewBeta} placeholder="e.g. Heel hook right on move 3" placeholderTextColor={colors.textMuted} multiline numberOfLines={3} style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.xl, color: colors.text, minHeight: 80 }, type.body]} />

              <PrimaryButton 
                testID="project-save-btn"
                label="Add Project" 
                disabled={!newGrade || !newTitle.trim()} 
                onPress={handleCreateProject} 
                style={{ marginBottom: 40 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log Climb Sheet */}
      <LogSheet
        visible={isLogSheetOpen}
        onClose={() => {
          setIsLogSheetOpen(false);
          setSelectedProject(null);
        }}
        onSave={handleSaveLog}
        initialGrade={selectedProject?.gradeRaw}
        initialResult={'attempt'}
      />
      <StartSessionSheet visible={isStartSessionSheetOpen} onClose={() => setIsStartSessionSheetOpen(false)} onStart={handleCreateSessionAndLog} />
    </Screen>
  );
}
