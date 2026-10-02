import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActionSheetIOS } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Filter, ChevronDown, Plus, Flag } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { ProjectCard } from '../components/ui/ProjectCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Chip } from '../components/ui/Chip';
import { Button as PrimaryButton } from '../components/ui/Button';
import { useRichProjects } from '../db/hooks';
import { triggerHaptic } from '../utils/haptics';
import * as Q from '../db/queries';

const GRADES = ['VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15'];
const WALL_ANGLES = [
  { key: 'slab', label: 'Slab' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'overhang', label: 'Overhang' },
  { key: 'roof', label: 'Roof' }
];
const HOLD_TYPES = [
  { key: 'crimps', label: 'Crimps' },
  { key: 'slopers', label: 'Slopers' },
  { key: 'pinches', label: 'Pinches' },
  { key: 'pockets', label: 'Pockets' },
  { key: 'volumes', label: 'Volumes' }
];

type SortOption = 'Recently tried' | 'Closest to sending' | 'Hardest' | 'Newest';

export default function ProjectsScreen() {
  const { colors, space, radius, type } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const allProjects = useRichProjects();

  const [activeTab, setActiveTab] = useState<'in_progress' | 'sent'>('in_progress');
  const [sortOption, setSortOption] = useState<SortOption>('Recently tried');
  
  // Filters
  const [wallAngleFilter, setWallAngleFilter] = useState<string | null>(null);
  const [holdTypeFilter, setHoldTypeFilter] = useState<string | null>(null);
  const [gymFilter, setGymFilter] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newAngle, setNewAngle] = useState('overhang');
  const [newHoldType, setNewHoldType] = useState('crimps');
  const [newTotalMoves, setNewTotalMoves] = useState('');
  const [newBeta, setNewBeta] = useState('');

  const activeProjects = useMemo(() => allProjects.filter(p => p.status === 'in_progress'), [allProjects]);
  const sentProjects = useMemo(() => allProjects.filter(p => p.status === 'sent'), [allProjects]);
  const totalBurns = useMemo(() => allProjects.reduce((sum, p) => sum + (p.attempts || 0), 0), [allProjects]);

  const displayedProjects = useMemo(() => {
    let base = activeTab === 'in_progress' ? activeProjects : sentProjects;
    
    if (wallAngleFilter) base = base.filter(p => p.wallAngle === wallAngleFilter);
    if (holdTypeFilter) base = base.filter(p => p.holdType === holdTypeFilter);
    if (gymFilter) base = base.filter(p => p.gymName === gymFilter);
    
    return [...base].sort((a, b) => {
      if (sortOption === 'Closest to sending') {
        const pctA = a.total_moves ? (a.high_water_mark_moves || 0) / a.total_moves : 0;
        const pctB = b.total_moves ? (b.high_water_mark_moves || 0) / b.total_moves : 0;
        return pctB - pctA;
      }
      if (sortOption === 'Hardest') {
        return (b.normalizedDifficulty || 0) - (a.normalizedDifficulty || 0);
      }
      if (sortOption === 'Newest') {
        return (b.created_at || 0) - (a.created_at || 0);
      }
      // Recently tried (default)
      return (b.lastTriedAt || 0) - (a.lastTriedAt || 0);
    });
  }, [activeTab, activeProjects, sentProjects, sortOption, wallAngleFilter, holdTypeFilter, gymFilter]);

  const hasActiveFilters = wallAngleFilter !== null || holdTypeFilter !== null || gymFilter !== null;

  const handleArchive = (id: string) => {
    Q.updateProjectStatus(id, 'abandoned');
  };

  const handleSaveProject = () => {
    Q.createProject({
      title: newTitle.trim(),
      gradeRaw: newGrade,
      normalizedDifficulty: GRADES.indexOf(newGrade as any),
      wallAngle: newAngle as any,
      holdType: newHoldType as any,
      status: 'in_progress',
      highWaterMarkMoves: 0,
      totalMoves: parseInt(newTotalMoves) || undefined,
      microBeta: newBeta.trim() || undefined,
    });
    setNewTitle('');
    setNewGrade('');
    setNewTotalMoves('');
    setNewBeta('');
    setIsAddModalOpen(false);
  };

  const openSortMenu = () => {
    triggerHaptic('light');
    if (Platform.OS === 'ios') {
      const options = ['Recently tried', 'Closest to sending', 'Hardest', 'Newest', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 4 },
        (idx) => {
          if (idx !== 4) setSortOption(options[idx] as SortOption);
        }
      );
    } else {
      // For android, simplified fallback
      const nextSort: Record<SortOption, SortOption> = {
        'Recently tried': 'Closest to sending',
        'Closest to sending': 'Hardest',
        'Hardest': 'Newest',
        'Newest': 'Recently tried'
      };
      setSortOption(nextSort[sortOption]);
    }
  };

  const handleClearFilters = () => {
    triggerHaptic('light');
    setWallAngleFilter(null);
    setHoldTypeFilter(null);
    setGymFilter(null);
  };

  return (
    <>
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 16) + 8 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={[type.display, { color: colors.text }]}>Projects</Text>
          <TouchableOpacity
            onPress={() => { triggerHaptic('light'); setIsAddModalOpen(true); }}
            style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            accessibilityLabel="New project"
            accessibilityRole="button"
          >
            <Plus size={16} color={colors.textOnAccent} />
            <Text style={[type.label, { color: colors.textOnAccent }]}>New</Text>
          </TouchableOpacity>
        </View>
        
        {/* Caption */}
        <Text style={[type.caption, { color: colors.textMuted, marginBottom: 12 }]}>
          {`${activeProjects.length} active · ${sentProjects.length} sent · ${totalBurns} burns`}
        </Text>

        {/* Control Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, padding: 2 }}>
            <TouchableOpacity
              onPress={() => { triggerHaptic('light'); setActiveTab('in_progress'); }}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: activeTab === 'in_progress' ? colors.bg : 'transparent' }}
              accessibilityLabel="In progress projects"
              accessibilityRole="button"
            >
              <Text style={[type.label, { color: activeTab === 'in_progress' ? colors.text : colors.textMuted }]}>
                In progress ({activeProjects.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { triggerHaptic('light'); setActiveTab('sent'); }}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: activeTab === 'sent' ? colors.bg : 'transparent' }}
              accessibilityLabel="Sent projects"
              accessibilityRole="button"
            >
              <Text style={[type.label, { color: activeTab === 'sent' ? colors.text : colors.textMuted }]}>
                Sent ({sentProjects.length})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={openSortMenu} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityRole="button" accessibilityLabel="Sort projects">
              <Text style={[type.body, { color: colors.text }]}>Sort: {sortOption}</Text>
              <ChevronDown size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setIsFilterModalOpen(true)} accessibilityRole="button" accessibilityLabel="Filter projects" style={{ position: 'relative' }}>
              <Filter size={20} color={hasActiveFilters ? colors.accent : colors.text} />
              {hasActiveFilters && (
                <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 16 }} showsVerticalScrollIndicator={false}>
        {displayedProjects.length === 0 ? (
          hasActiveFilters ? (
            <View>
              <EmptyState 
                icon={<Filter size={24} color={colors.textMuted} />} 
                title="No matching projects" 
                body="Try changing your filters." 
              />
              <TouchableOpacity onPress={handleClearFilters} style={{ alignSelf: 'center', marginTop: 16 }}>
                <Text style={[type.body, { color: colors.accent }]}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : activeTab === 'in_progress' ? (
            <EmptyState 
              icon={<Flag size={24} color={colors.textMuted} />} 
              title="No active projects" 
              body="Add something to work on next." 
            />
          ) : (
            <EmptyState 
              icon={<Flag size={24} color={colors.textMuted} />} 
              title="No sent projects" 
              body="Your first send will show up here." 
            />
          )
        ) : (
          displayedProjects.map((p: any) => (
            <ProjectCard 
              key={p.id}
              project={p} 
              onLogAttempt={activeTab === 'in_progress' ? () => Alert.alert('Log Attempt', 'Use active session.') : undefined} 
              onArchive={activeTab === 'in_progress' ? () => handleArchive(p.id) : undefined}
            />
          ))
        )}
      </ScrollView>
    </View>

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

      {/* Filter Modal */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={[type.heading, { color: colors.text }]}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: 12 }]}>Wall Angle</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {WALL_ANGLES.map(a => (
                <Chip key={a.key} label={a.label} active={wallAngleFilter === a.key} onPress={() => setWallAngleFilter(wallAngleFilter === a.key ? null : a.key)} />
              ))}
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: 12 }]}>Hold Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {HOLD_TYPES.map(h => (
                <Chip key={h.key} label={h.label} active={holdTypeFilter === h.key} onPress={() => setHoldTypeFilter(holdTypeFilter === h.key ? null : h.key)} />
              ))}
            </View>

            <PrimaryButton label="Apply Filters" onPress={() => setIsFilterModalOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}
