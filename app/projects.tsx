import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActionSheetIOS } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { listLayout } from '../theme/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Filter, ChevronDown, Plus, Flag, ArrowUpDown } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { ProjectCard } from '../components/ui/ProjectCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Chip } from '../components/ui/Chip';
import { PrimaryButton } from '../components/ui/PrimaryButton';
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
          <Text style={[type.display, { color: colors.text }]}>Projects</Text>
          <TouchableOpacity
            onPress={() => { triggerHaptic('light'); setIsAddModalOpen(true); }}
            style={{
              backgroundColor: colors.accent,
              height: 56,
              minHeight: 56,
              paddingHorizontal: 20,
              borderRadius: radius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            accessibilityLabel="New project"
            accessibilityRole="button"
          >
            <Plus size={20} color={colors.textOnAccent} />
            <Text style={[type.heading, { color: colors.textOnAccent, fontSize: 16 }]}>New</Text>
          </TouchableOpacity>
        </View>
        
        {/* Bento Telemetry Metric Strip */}
        <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
          <View style={{ flex: 1, backgroundColor: colors.materialBase, borderWidth: 0, borderColor: colors.border, borderRadius: radius.md, padding: space.sm, minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[type.stat, { fontSize: 22, color: colors.text, fontVariant: ['tabular-nums'] }]}>{activeProjects.length}</Text>
            <Text style={[type.label, { color: colors.textMuted, fontSize: 10, marginTop: 2 }]}>ACTIVE</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.materialBase, borderWidth: 0, borderColor: colors.border, borderRadius: radius.md, padding: space.sm, minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[type.stat, { fontSize: 22, color: colors.flashText, fontVariant: ['tabular-nums'] }]}>{sentProjects.length}</Text>
            <Text style={[type.label, { color: colors.textMuted, fontSize: 10, marginTop: 2 }]}>SENT</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.materialBase, borderWidth: 0, borderColor: colors.border, borderRadius: radius.md, padding: space.sm, minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[type.stat, { fontSize: 22, color: colors.text, fontVariant: ['tabular-nums'] }]}>{totalBurns}</Text>
            <Text style={[type.label, { color: colors.textMuted, fontSize: 10, marginTop: 2 }]}>BURNS</Text>
          </View>
        </View>

        {/* Control Row */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{
              flex: 1,
              flexDirection: 'row',
              backgroundColor: colors.materialBase,
              borderRadius: radius.pill,
              height: 56,
              minHeight: 56,
              padding: 4,
            }}>
              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setActiveTab('in_progress'); }}
                accessibilityRole="button"
                accessibilityState={{ selected: activeTab === 'in_progress' }}
                accessibilityLabel="In progress projects"
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  backgroundColor: activeTab === 'in_progress' ? colors.accent : 'transparent',
                }}
              >
                <Text style={[type.heading, { color: activeTab === 'in_progress' ? colors.textWhitePrimary : colors.textWhiteSecondary, fontSize: 13, fontWeight: '400' }]}>
                  In progress ({activeProjects.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setActiveTab('sent'); }}
                accessibilityRole="button"
                accessibilityState={{ selected: activeTab === 'sent' }}
                accessibilityLabel="Sent projects"
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  backgroundColor: activeTab === 'sent' ? colors.accent : 'transparent',
                }}
              >
                <Text style={[type.heading, { color: activeTab === 'sent' ? colors.textWhitePrimary : colors.textWhiteSecondary, fontSize: 13, fontWeight: '400' }]}>
                  Sent ({sentProjects.length})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={openSortMenu}
                style={{
                  width: 56,
                  height: 56,
                  minHeight: 56,
                  backgroundColor: colors.materialBase,
                  borderRadius: radius.md,
                  borderWidth: 0,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Sort projects"
              >
                <ArrowUpDown size={22} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Filter projects"
                style={{
                  width: 56,
                  height: 56,
                  minHeight: 56,
                  backgroundColor: colors.materialBase,
                  borderRadius: radius.md,
                  borderWidth: 0,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Filter size={22} color={hasActiveFilters ? colors.accentText : colors.text} />
                {hasActiveFilters && (
                  <View style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
            <Text style={[type.caption, { color: colors.textMuted, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
              {(() => {
                const parts = [`Sort: ${sortOption}`];
                if (gymFilter) parts.push(gymFilter);
                if (wallAngleFilter) parts.push(wallAngleFilter);
                if (holdTypeFilter) parts.push(holdTypeFilter);
                return parts.join(' · ');
              })()}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={handleClearFilters} style={{ marginLeft: 8 }}>
                <Text style={[type.caption, { color: colors.accent }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </View>

      <Reanimated.ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 16 }} showsVerticalScrollIndicator={false}>
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
            <Reanimated.View key={p.id} layout={listLayout}>
              <ProjectCard
                project={p}
                onLogAttempt={activeTab === 'in_progress' ? () => Alert.alert('Log Attempt', 'Use active session.') : undefined}
                onArchive={activeTab === 'in_progress' ? () => handleArchive(p.id) : undefined}
              />
            </Reanimated.View>
          ))
        )}
      </Reanimated.ScrollView>
    </View>

      {/* New Project Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 24) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, marginBottom: space.lg }}>
              <Text style={[type.display, { color: colors.text }]}>New Project</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.materialBase,
                  borderWidth: 0,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Reanimated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 120 }}>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>PROJECT NAME</Text>
              <TextInput
                testID="project-nickname-input"
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Blue sloper on the prow"
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    backgroundColor: colors.materialBase,
                    borderRadius: radius.md,
                    borderWidth: 0,
                    borderColor: colors.border,
                    paddingHorizontal: space.md,
                    height: 56,
                    minHeight: 56,
                    marginBottom: space.lg,
                    color: colors.text,
                  },
                ]}
              />

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>TARGET GRADE</Text>
              <Reanimated.ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.lg }}>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {GRADES.map(g => (
                    <Chip key={g} label={g} active={newGrade === g} onPress={() => { triggerHaptic('light'); setNewGrade(g); }} />
                  ))}
                </View>
              </Reanimated.ScrollView>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>WALL ANGLE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {WALL_ANGLES.map(a => (
                  <Chip key={a.key} label={a.label} active={newAngle === a.key} onPress={() => { triggerHaptic('light'); setNewAngle(a.key); }} />
                ))}
              </View>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>HOLD TYPE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {HOLD_TYPES.map(h => (
                  <Chip key={h.key} label={h.label} active={newHoldType === h.key} onPress={() => { triggerHaptic('light'); setNewHoldType(h.key); }} />
                ))}
              </View>

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>ESTIMATED TOTAL MOVES (OPTIONAL)</Text>
              <TextInput
                value={newTotalMoves}
                onChangeText={setNewTotalMoves}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    backgroundColor: colors.materialBase,
                    borderRadius: radius.md,
                    borderWidth: 0,
                    borderColor: colors.border,
                    paddingHorizontal: space.md,
                    height: 56,
                    minHeight: 56,
                    marginBottom: space.lg,
                    color: colors.text,
                  },
                ]}
              />

              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>INITIAL NOTES (OPTIONAL)</Text>
              <TextInput
                value={newBeta}
                onChangeText={setNewBeta}
                multiline
                placeholder="Micro-beta, sequence..."
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    backgroundColor: colors.materialBase,
                    borderRadius: radius.md,
                    borderWidth: 0,
                    borderColor: colors.border,
                    padding: space.md,
                    marginBottom: space.xl,
                    minHeight: 96,
                    color: colors.text,
                    textAlignVertical: 'top',
                  },
                ]}
              />

              <PrimaryButton testID="save-project-btn" label="SAVE PROJECT" onPress={handleSaveProject} disabled={!newTitle.trim() || !newGrade} />
            </Reanimated.ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.materialBase, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 0, borderColor: colors.border, padding: space.xl, paddingBottom: Math.max(insets.bottom, space.xl) }}>
            {/* Drag Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space.md }} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
              <Text style={[type.heading, { color: colors.text, fontSize: 18 }]}>Filters</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: colors.materialBase,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>WALL ANGLE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
              {WALL_ANGLES.map(a => (
                <Chip key={a.key} label={a.label} active={wallAngleFilter === a.key} onPress={() => setWallAngleFilter(wallAngleFilter === a.key ? null : a.key)} />
              ))}
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>HOLD TYPE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.xl }}>
              {HOLD_TYPES.map(h => (
                <Chip key={h.key} label={h.label} active={holdTypeFilter === h.key} onPress={() => setHoldTypeFilter(holdTypeFilter === h.key ? null : h.key)} />
              ))}
            </View>

            <PrimaryButton label="APPLY FILTERS" onPress={() => setIsFilterModalOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}
