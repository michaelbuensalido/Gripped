import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Target,
  CheckCircle2,
  Flame,
  X,
  Play,
  FileText,
  Compass,
} from 'lucide-react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useSessionStore } from '../store/sessionStore';
import { useProjects } from '../db/hooks';
import type { Project, WallAngle, HoldType } from '../types';
import { triggerHaptic } from '../utils/haptics';

const WALL_ANGLES: { key: WallAngle; label: string }[] = [
  { key: 'slab', label: 'Slab' },
  { key: 'vertical', label: 'Vert' },
  { key: 'overhang', label: 'Overhang' },
  { key: 'roof', label: 'Roof/Cave' },
];

const HOLD_TYPES: { key: HoldType; label: string }[] = [
  { key: 'crimps', label: 'Crimps' },
  { key: 'slopers', label: 'Slopers' },
  { key: 'pinches', label: 'Pinches' },
  { key: 'pockets', label: 'Pockets' },
  { key: 'volumes', label: 'Volumes' },
];

const GRADES = ['V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13'];

export default function ProjectsScreen() {
  const router = useRouter();
  const projects = useProjects() || [];
  const loadProjects = () => {};
  const createProject = useSessionStore((s) => s.createProject);
  const updateProjectStatus = useSessionStore((s) => s.updateProjectStatus);
  const updateProjectHighWaterMark = useSessionStore((s) => s.updateProjectHighWaterMark);
  const setActiveProjectTarget = useSessionStore((s) => s.setActiveProjectTarget);

  const [activeTab, setActiveTab] = useState<'in_progress' | 'sent' | 'all'>('in_progress');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('V6');
  const [newAngle, setNewAngle] = useState<WallAngle>('overhang');
  const [newHoldType, setNewHoldType] = useState<HoldType>('crimps');
  const [newTotalMoves, setNewTotalMoves] = useState('12');
  const [newBeta, setNewBeta] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  const inSiegeCount = useMemo(
    () => projects.filter((p) => p.status === 'in_progress').length,
    [projects]
  );
  const sentCount = useMemo(
    () => projects.filter((p) => p.status === 'sent').length,
    [projects]
  );
  const totalCount = projects.length;

  const filteredProjects = useMemo(() => {
    if (activeTab === 'all') return projects;
    return projects.filter((p) => p.status === activeTab);
  }, [projects, activeTab]);

  const handleCreateProject = () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a project name (e.g. Cave Roof V6)');
      return;
    }

    const total = parseInt(newTotalMoves, 10);
    createProject({
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
    setNewBeta('');
    setNewTotalMoves('12');
  };

  const handleStartSiege = (project: Project) => {
    triggerHaptic('heavy');
    setActiveProjectTarget(project);
    router.push('/session/active');
  };

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 170,
        }}
      >
        {/* ── 1. Header ──────────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-[32px] font-black tracking-tight">
              Projects
            </Text>
            <Text className="text-[#555562] text-[10px] font-black tracking-[2px] uppercase mt-0.5">
              SIEGE HIT-LIST · KANBAN
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('light');
              setIsAddModalOpen(true);
            }}
            className="w-10 h-10 bg-[#19191D] border border-[#8E7CFF] rounded-xl items-center justify-center"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Add New Project"
          >
            <Plus size={20} color="#8E7CFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── 2. Recessed Pill-Shaped Tabs ─────────────────────────────────── */}
        <View className="flex-row gap-2 mb-5">
          {[
            { key: 'in_progress', label: `IN SIEGE (${inSiegeCount})` },
            { key: 'sent', label: `SENT (${sentCount})` },
            { key: 'all', label: `ALL (${totalCount})` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab(tab.key as any);
                }}
                className={`px-4 py-2 rounded-full border ${
                  isActive
                    ? 'bg-[#8E7CFF]/15 border-[#8E7CFF]'
                    : 'bg-[#141417] border-[#22222A]'
                }`}
              >
                <Text
                  className={`text-[11px] font-black tracking-wider uppercase ${
                    isActive ? 'text-[#8E7CFF]' : 'text-[#9090A0]'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 3. Project Cards ─────────────────────────────────────────────── */}
        {filteredProjects.length === 0 ? (
          <View className="bg-[#19191D] border border-[#27272F] rounded-2xl p-8 items-center justify-center my-4">
            <Target size={36} color="#555562" />
            <Text className="text-white text-base font-bold mt-3 mb-1">
              No active projects in this view
            </Text>
            <Text className="text-[#9090A0] text-xs text-center mb-5 px-4 leading-4">
              Add the specific boulders you are actively sieging to track your high-water mark and micro-beta.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('medium');
                setIsAddModalOpen(true);
              }}
              className="bg-[#19191D] border border-[#8E7CFF] px-5 py-2.5 rounded-xl flex-row items-center gap-2"
            >
              <Plus size={16} color="#8E7CFF" strokeWidth={2.5} />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Create First Project
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-3.5">
            {filteredProjects.map((project) => {
              const isSent = project.status === 'sent';
              const maxMoves = project.totalMoves && project.totalMoves > 0 ? project.totalMoves : 12;
              const progressPct = Math.min(
                100,
                Math.round((project.highWaterMarkMoves / maxMoves) * 100)
              );

              return (
                <View
                  key={project.id}
                  className="bg-[#19191D] border border-[#27272F] rounded-2xl p-4 overflow-hidden"
                >
                  {/* Header: V-Grade Block + Route Name + Angle/Hold Tags */}
                  <View className="flex-row items-center justify-between mb-3.5">
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      {/* V-Grade block */}
                      <View className="w-13 h-13 bg-[#141417] border border-[#8E7CFF]/50 rounded-xl items-center justify-center px-2 py-1.5">
                        <Text className="text-[#8E7CFF] font-black text-base tracking-tight">
                          {project.gradeRaw}
                        </Text>
                      </View>

                      {/* Route Name & Tags */}
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base tracking-tight" numberOfLines={1}>
                          {project.title}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <Compass size={10} color="#9090A0" />
                          <Text className="text-[#9090A0] text-[10px] font-black uppercase tracking-widest">
                            {project.wallAngle} · {project.holdType}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Toggle */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        triggerHaptic('medium');
                        updateProjectStatus(
                          project.id,
                          isSent ? 'in_progress' : 'sent'
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border flex-row items-center gap-1.5 ${
                        isSent
                          ? 'bg-[#6EE756]/15 border-[#6EE756]'
                          : 'bg-[#141417] border-[#22222A]'
                      }`}
                    >
                      <CheckCircle2
                        size={12}
                        color={isSent ? '#6EE756' : '#555562'}
                      />
                      <Text
                        className={`text-[10px] font-black tracking-wider uppercase ${
                          isSent ? 'text-[#6EE756]' : 'text-[#9090A0]'
                        }`}
                      >
                        {isSent ? 'SENT' : 'IN SIEGE'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Micro Beta (if present) */}
                  {project.microBeta && (
                    <View className="bg-[#141417] border border-[#22222A] rounded-xl p-3 mb-3.5">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <FileText size={11} color="#8E7CFF" />
                        <Text className="text-[#8E7CFF] text-[9px] font-black uppercase tracking-widest">
                          Micro Beta
                        </Text>
                      </View>
                      <Text className="text-[#9090A0] text-xs leading-4">
                        {project.microBeta}
                      </Text>
                    </View>
                  )}

                  {/* Progress Bar: HIGH-WATER MARK */}
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-[#555562] text-[10px] font-black uppercase tracking-widest">
                        HIGH-WATER MARK
                      </Text>
                      <Text className="text-white text-xs font-mono font-bold">
                        {project.highWaterMarkMoves} / {maxMoves} moves
                        {progressPct > 0 ? ` (${progressPct}%)` : ''}
                      </Text>
                    </View>
                    <View className="w-full h-2 bg-[#141417] border border-[#22222A] rounded-full overflow-hidden">
                      <View
                        className="h-full bg-[#8E7CFF] rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </View>
                  </View>

                  {/* Action Row: Split Buttons */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-[#22222A]">
                    {/* +1 Move Link */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        triggerHaptic('light');
                        updateProjectHighWaterMark(
                          project.id,
                          Math.min(maxMoves, project.highWaterMarkMoves + 1)
                        );
                      }}
                      className="bg-[#141417] border border-[#22222A] px-3.5 py-2.5 rounded-xl flex-row items-center gap-1.5"
                    >
                      <Flame size={13} color="#FF453A" />
                      <Text className="text-white text-xs font-bold tracking-tight">
                        +1 Move Link
                      </Text>
                    </TouchableOpacity>

                    {/* SIEGE NOW */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleStartSiege(project)}
                      className="bg-[#8E7CFF] px-4.5 py-2.5 rounded-xl flex-row items-center gap-1.5"
                    >
                      <Play size={11} color="#FFFFFF" fill="#FFFFFF" />
                      <Text className="text-white text-xs font-black uppercase tracking-wider">
                        SIEGE NOW
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── 4. Add Project Modal ─────────────────────────────────────────── */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/80 justify-end"
        >
          <View className="bg-[#19191D] border-t border-[#27272F] rounded-t-2xl p-6 max-h-[88%]">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-xl font-black tracking-tight">
                  New Project
                </Text>
                <Text className="text-[#9090A0] text-xs mt-0.5">
                  Add a route to your personal siege hit-list
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#141417] border border-[#22222A] items-center justify-center"
              >
                <X size={16} color="#9090A0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Project Name */}
              <Text className="text-[#9090A0] text-xs font-black uppercase tracking-wider mb-2">
                Project Name
              </Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Cave Roof V6"
                placeholderTextColor="#555562"
                className="bg-[#141417] border border-[#22222A] rounded-xl px-4 py-3 text-white text-sm mb-4 font-semibold"
              />

              {/* Grade Selection */}
              <Text className="text-[#9090A0] text-xs font-black uppercase tracking-wider mb-2">
                Target Grade
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row gap-2">
                  {GRADES.map((g) => {
                    const isSelected = newGrade === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => {
                          triggerHaptic('light');
                          setNewGrade(g);
                        }}
                        className={`px-3.5 py-2 rounded-xl border ${
                          isSelected
                            ? 'bg-[#8E7CFF] border-[#8E7CFF]'
                            : 'bg-[#141417] border-[#22222A]'
                        }`}
                      >
                        <Text
                          className={`text-xs font-black ${
                            isSelected ? 'text-white' : 'text-[#9090A0]'
                          }`}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Wall Angle Selection */}
              <Text className="text-[#9090A0] text-xs font-black uppercase tracking-wider mb-2">
                Wall Angle
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {WALL_ANGLES.map((a) => {
                  const isSelected = newAngle === a.key;
                  return (
                    <TouchableOpacity
                      key={a.key}
                      onPress={() => {
                        triggerHaptic('light');
                        setNewAngle(a.key);
                      }}
                      className={`px-3.5 py-2 rounded-xl border ${
                        isSelected
                          ? 'bg-[#8E7CFF]/20 border-[#8E7CFF]'
                          : 'bg-[#141417] border-[#22222A]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isSelected ? 'text-[#8E7CFF]' : 'text-[#9090A0]'
                        }`}
                      >
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Hold Type Selection */}
              <Text className="text-[#9090A0] text-xs font-black uppercase tracking-wider mb-2">
                Hold Type
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {HOLD_TYPES.map((h) => {
                  const isSelected = newHoldType === h.key;
                  return (
                    <TouchableOpacity
                      key={h.key}
                      onPress={() => {
                        triggerHaptic('light');
                        setNewHoldType(h.key);
                      }}
                      className={`px-3 py-1.5 rounded-lg border ${
                        isSelected
                          ? 'bg-[#8E7CFF]/20 border-[#8E7CFF]'
                          : 'bg-[#141417] border-[#22222A]'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          isSelected ? 'text-[#8E7CFF]' : 'text-[#9090A0]'
                        }`}
                      >
                        {h.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Total Moves */}
              <Text className="text-[#9090A0] text-xs font-black uppercase tracking-wider mb-2">
                Total Moves
              </Text>
              <TextInput
                value={newTotalMoves}
                onChangeText={setNewTotalMoves}
                keyboardType="number-pad"
                placeholder="12"
                placeholderTextColor="#555562"
                className="bg-[#141417] border border-[#22222A] rounded-xl px-4 py-3 text-white text-sm mb-4 font-mono font-bold"
              />

              {/* Micro-Beta Notes */}
              <Text className="text-[#9090A0] text-xs font-black uppercase tracking-wider mb-2">
                Micro-Beta Notes (Optional)
              </Text>
              <TextInput
                value={newBeta}
                onChangeText={setNewBeta}
                placeholder="e.g. Heel hook right on move 3, high left foot for the crux slap"
                placeholderTextColor="#555562"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-[#141417] border border-[#22222A] rounded-xl p-4 text-white text-sm mb-6 min-h-[80px]"
              />

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCreateProject}
                className="w-full h-13 bg-[#8E7CFF] rounded-xl items-center justify-center mb-8"
              >
                <Text className="text-white text-sm font-black uppercase tracking-wider">
                  ADD TO SIEGE LIST
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
