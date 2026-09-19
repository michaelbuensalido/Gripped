import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, Settings as SettingsIcon, MoreVertical } from 'lucide-react-native';
import { getAllRoutinesWithBlocks, duplicateRoutine, deleteRoutine } from '../db/routineQueries';
import type { RoutineWithBlocks } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { RoutineLaunchCard } from '../components/routines/RoutineLaunchCard';
import { HangboardTimerCard } from '../components/routines/HangboardTimerCard';
import { RouteTemplateList } from '../components/routines/RouteTemplateList';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { triggerHaptic } from '../utils/haptics';

export default function RoutinesListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my_routines' | 'templates'>('my_routines');
  const [routines, setRoutines] = useState<RoutineWithBlocks[]>([]);
  const startEmptySession = useSessionStore((s) => s.startEmptySession);
  const startSessionFromRoutine = useSessionStore((s) => s.startSessionFromRoutine);

  const loadRoutines = useCallback(() => {
    try {
      const all = getAllRoutinesWithBlocks();
      setRoutines(all);
    } catch (e) {
      console.error('Failed to load routines:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  const myRoutines = routines.filter((r) => r.isCustom);

  const handleStartEmpty = () => {
    const sessionId = startEmptySession('Freestyle Session');
    router.push(`/session/${sessionId}`);
  };

  const handleStartRoutine = (routine: RoutineWithBlocks) => {
    const sessionId = startSessionFromRoutine(routine, 'Bouldering Session');
    router.push(`/session/${sessionId}`);
  };

  const handleEditRoutine = (routine: RoutineWithBlocks) => {
    router.push({ pathname: '/routines/editor', params: { id: routine.id } });
  };

  const handleDuplicateRoutine = (routineId: string) => {
    try {
      duplicateRoutine(routineId);
      loadRoutines();
    } catch (e) {
      Alert.alert('Error', 'Could not duplicate routine.');
    }
  };

  const handleDeleteRoutine = (routineId: string) => {
    Alert.alert(
      'Delete Routine?',
      'Are you sure you want to delete this custom routine template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteRoutine(routineId);
              loadRoutines();
            } catch (e) {
              Alert.alert('Error', 'Could not delete routine.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 54,
          paddingBottom: 120,
        }}
      >
        {/* Header Row */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[28px] font-bold text-white tracking-[-0.5px]">Training</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            className="w-[40px] h-[40px] bg-[#19191D] border border-[#27272F] rounded-xl items-center justify-center"
          >
            <SettingsIcon size={20} color="#9090A0" />
          </TouchableOpacity>
        </View>

        {/* Quick Freestyle Card */}
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            handleStartEmpty();
          }}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
          className="h-[54px] bg-[#19191D] border border-[#27272F] rounded-xl px-4 flex-row items-center justify-between mb-6"
        >
          <View className="flex-col justify-center">
            <Text className="text-white text-[14px] font-bold">Quick Freestyle Session</Text>
            <Text className="text-[#9090A0] text-[12px]">Log burns as you climb • Untracked</Text>
          </View>
          <ChevronRight size={16} color="#555562" />
        </Pressable>

        {/* Hangboard Protocol */}
        <HangboardTimerCard />

        {/* Sub-Navigation Bar */}
        <View className="h-[40px] bg-[#141417] border border-[#22222A] rounded-xl p-1 flex-row mb-4">
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('my_routines');
            }}
            className={`flex-1 items-center justify-center rounded-lg ${
              activeTab === 'my_routines' ? 'bg-[#1E1E24] border border-[#2C2C35]' : 'border border-transparent'
            }`}
          >
            <Text className={`text-[12px] ${activeTab === 'my_routines' ? 'font-bold text-white' : 'text-[#8A8A98]'}`}>
              + New Routine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('templates');
            }}
            className={`flex-1 items-center justify-center rounded-lg ${
              activeTab === 'templates' ? 'bg-[#1E1E24] border border-[#2C2C35]' : 'border border-transparent'
            }`}
          >
            <Text className={`text-[12px] ${activeTab === 'templates' ? 'font-bold text-white' : 'text-[#8A8A98]'}`}>
              Route Templates
            </Text>
          </TouchableOpacity>
        </View>

        {/* Routine List */}
        {activeTab === 'templates' ? (
          <RouteTemplateList onStart={handleStartRoutine} />
        ) : myRoutines.length === 0 ? (
          <TouchableOpacity 
            onPress={() => router.push('/routines/editor')}
            activeOpacity={0.7}
            className="h-[70px] border border-dashed border-[#27272F] rounded-xl flex-row items-center justify-center gap-2 mb-3"
          >
            <Text className="text-[13px] font-semibold text-[#8A8A98]">+ Create your first custom routine</Text>
          </TouchableOpacity>
        ) : (
          myRoutines.map((routine) => (
            <RoutineLaunchCard
              key={routine.id}
              routine={routine}
              onStart={handleStartRoutine}
              onEdit={handleEditRoutine}
              onDuplicate={handleDuplicateRoutine}
              onDelete={handleDeleteRoutine}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
