import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Text, TextInput, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X, Target } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { EmptyState } from '../components/ui/EmptyState';
import { ProjectCard } from '../components/ui/ProjectCard';
import { SentProjectCard } from '../components/ui/SentProjectCard';
import { FilterChip } from '../components/ui/FilterChip';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { StatTile } from '../components/ui/StatTile';
import { useRichProjects } from '../db/hooks';
import { insertProject, updateProjectStatus } from '../db/queries';
import { sortProjects } from '../utils/projectSort';
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
  { key: 'jugs', label: 'Jugs' },
  { key: 'pockets', label: 'Pockets' },
];

const GRADES = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12'];

type SortOption = 'Closest to sending' | 'Recently tried' | 'Hardest';

export default function ProjectsScreen() {
  const { colors, space, type, radius, shadow } = useTheme();
  const router = useRouter();
  
  const allProjects = useRichProjects() || [];
  
  const activeProjects = allProjects.filter((p: any) => p.status === 'in_progress');
  const sentProjects = allProjects.filter((p: any) => p.status === 'sent');
  const totalBurns = allProjects.reduce((sum: number, p: any) => sum + (p.attempts || 0), 0);

  const [activeTab, setActiveTab] = useState<'in_progress' | 'sent'>('in_progress');
  const [sortOption, setSortOption] = useState<SortOption>('Recently tried');
  const [wallAngleFilter, setWallAngleFilter] = useState<string | null>(null);

  // Add Project state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState(''); 
  const [newAngle, setNewAngle] = useState('overhang');
  const [newHoldType, setNewHoldType] = useState('crimps');
  const [newTotalMoves, setNewTotalMoves] = useState('12');
  const [newBeta, setNewBeta] = useState('');

  const displayedProjects = useMemo(() => {
    let list = activeTab === 'in_progress' ? activeProjects : sentProjects;
    
    if (wallAngleFilter) {
      list = list.filter((p: any) => p.wallAngle === wallAngleFilter);
    }
    
    return sortProjects(list, sortOption);
  }, [activeProjects, sentProjects, activeTab, sortOption, wallAngleFilter]);

  const handleSaveProject = () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a project nickname');
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

  const handleArchive = (id: string) => {
    triggerHaptic('light');
    updateProjectStatus(id, 'abandoned');
  };

  return (
    <>
      <Screen title="Projects" scroll={false}>
        <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
          <StatTile flex label="Active" value={activeProjects.length} />
          <StatTile flex label="Sent" value={sentProjects.length} />
          <StatTile flex label="Total Burns" value={totalBurns} />
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, padding: 4, marginBottom: space.md }}>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: activeTab === 'in_progress' ? colors.bg : 'transparent', borderRadius: radius.pill }}
            onPress={() => { triggerHaptic('light'); setActiveTab('in_progress'); }}
          >
            <Text style={[type.body, { color: activeTab === 'in_progress' ? colors.text : colors.textMuted, fontWeight: activeTab === 'in_progress' ? '600' : '400' }]}>
              In Progress ({activeProjects.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: activeTab === 'sent' ? colors.bg : 'transparent', borderRadius: radius.pill }}
            onPress={() => { triggerHaptic('light'); setActiveTab('sent'); }}
          >
            <Text style={[type.body, { color: activeTab === 'sent' ? colors.text : colors.textMuted, fontWeight: activeTab === 'sent' ? '600' : '400' }]}>
              Sent ({sentProjects.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: space.md }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, gap: space.sm }}>
              {(['Closest to sending', 'Recently tried', 'Hardest'] as SortOption[]).map(opt => (
                <FilterChip
                  key={opt}
                  label={opt}
                  active={sortOption === opt}
                  onPress={() => { triggerHaptic('light'); setSortOption(opt); }}
                />
              ))}
              <View style={{ width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: space.xs, alignSelf: 'center' }} />
              {WALL_ANGLES.map(opt => (
                <FilterChip
                  key={opt.key}
                  label={opt.label}
                  active={wallAngleFilter === opt.key}
                  onPress={() => { 
                    triggerHaptic('light'); 
                    setWallAngleFilter(wallAngleFilter === opt.key ? null : opt.key); 
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
          {displayedProjects.length === 0 ? (
            activeTab === 'in_progress' ? (
              <EmptyState 
                icon={<Target size={24} color={colors.textMuted} />} 
                title="No active projects" 
                body="Add something to work on next." 
              />
            ) : (
              <EmptyState 
                icon={<Target size={24} color={colors.textMuted} />} 
                title="No sent projects" 
                body="Your first send will show up here." 
              />
            )
          ) : (
            displayedProjects.map((p: any) => (
              activeTab === 'sent' ? (
                <SentProjectCard key={p.id} project={p} onPress={() => router.push(`/project/${p.id}`)} />
              ) : (
                <TouchableOpacity key={p.id} activeOpacity={0.9} onPress={() => router.push(`/project/${p.id}`)}>
                  <ProjectCard 
                    project={p} 
                    onLogAttempt={() => Alert.alert('Log Attempt', 'Use active session.')} 
                    onArchive={() => handleArchive(p.id)}
                  />
                </TouchableOpacity>
              )
            ))
          )}
        </ScrollView>
      </Screen>

      <TouchableOpacity 
        testID="add-project-fab"
        onPress={() => { triggerHaptic('light'); setIsAddModalOpen(true); }}
        activeOpacity={0.8}
        style={[
          {
            position: 'absolute',
            bottom: 104, // Tab bar height (88) + 16px
            right: space.lg,
            backgroundColor: colors.accent,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: radius.pill,
            zIndex: 10,
          },
          shadow.floating
        ]}
      >
        <Target size={20} color={colors.textOnAccent} />
        <Text style={[type.heading, { color: colors.textOnAccent, fontSize: 15 }]}>New project</Text>
      </TouchableOpacity>

      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 60 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, marginBottom: space.xl }}>
              <Text style={[type.display, { color: colors.text }]}>New Project</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)} style={{ padding: space.sm }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 100 }}>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Project Nickname</Text>
              <TextInput testID="project-nickname-input" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Cave Roof V6" placeholderTextColor={colors.textMuted} style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.lg, color: colors.text }, type.body]} />

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Target Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.lg }}>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {GRADES.map(g => (
                    <TouchableOpacity key={g} onPress={() => { triggerHaptic('light'); setNewGrade(g); }} style={{ backgroundColor: newGrade === g ? colors.accent : colors.card, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md }}>
                      <Text style={[type.body, { color: newGrade === g ? colors.textOnAccent : colors.text }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Wall Angle</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {WALL_ANGLES.map(a => (
                  <TouchableOpacity key={a.key} onPress={() => { triggerHaptic('light'); setNewAngle(a.key); }} style={{ backgroundColor: newAngle === a.key ? colors.accent : colors.card, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md }}>
                    <Text style={[type.body, { color: newAngle === a.key ? colors.textOnAccent : colors.text }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Hold Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {HOLD_TYPES.map(h => (
                  <TouchableOpacity key={h.key} onPress={() => { triggerHaptic('light'); setNewHoldType(h.key); }} style={{ backgroundColor: newHoldType === h.key ? colors.accent : colors.card, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md }}>
                    <Text style={[type.body, { color: newHoldType === h.key ? colors.textOnAccent : colors.text }]}>{h.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Estimated Total Moves (for progress)</Text>
              <TextInput value={newTotalMoves} onChangeText={setNewTotalMoves} keyboardType="numeric" placeholder="12" placeholderTextColor={colors.textMuted} style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.lg, color: colors.text }, type.body]} />

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Initial Notes (Optional)</Text>
              <TextInput value={newBeta} onChangeText={setNewBeta} multiline placeholder="Micro-beta, sequence..." placeholderTextColor={colors.textMuted} style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.xl, minHeight: 80, color: colors.text }, type.body]} />

              <PrimaryButton testID="save-project-btn" label="Save Project" onPress={handleSaveProject} disabled={!newTitle.trim() || !newGrade} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
