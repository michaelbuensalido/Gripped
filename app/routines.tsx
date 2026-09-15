import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Compass,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import {
  getAllRoutinesWithBlocks,
  duplicateRoutine,
  deleteRoutine,
} from '../db/routineQueries';
import type { RoutineWithBlocks } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { RoutineLaunchCard } from '../components/routines/RoutineLaunchCard';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { triggerHaptic } from '../utils/haptics';

export default function RoutinesListScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [drillsY, setDrillsY] = useState(0);

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

  // Split into Custom vs Default Templates
  const myRoutines = routines.filter((r) => r.isCustom);
  const exampleTemplates = routines.filter((r) => !r.isCustom);

  const handleStartEmpty = () => {
    const sessionId = startEmptySession('Freestyle Session');
    router.push(`/session/${sessionId}`);
  };

  const handleStartRoutine = (routine: RoutineWithBlocks) => {
    const sessionId = startSessionFromRoutine(routine, 'Bouldering Session');
    router.push(`/session/${sessionId}`);
  };

  const handleEditRoutine = (routine: RoutineWithBlocks) => {
    router.push({
      pathname: '/routines/editor',
      params: { id: routine.id },
    });
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

  const handleBrowseDrills = () => {
    triggerHaptic('light');
    if (drillsY > 0) {
      scrollViewRef.current?.scrollTo({ y: drillsY - 20, animated: true });
    }
  };

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 160,
        }}
      >
        {/* ── 1. Top Header & Settings Button ────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 26,
              fontWeight: '700',
              letterSpacing: -0.5,
            }}
          >
            Training
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#1E1E24',
              borderWidth: 1,
              borderColor: '#2C2C35',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon size={18} color="#8A8A98" />
          </TouchableOpacity>
        </View>

        {/* ── Quick Launch Button ("Start Empty Workout" equivalent) ── */}
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            handleStartEmpty();
          }}
          style={({ pressed }) => ({
            width: '100%',
            height: 50,
            borderRadius: 12,
            backgroundColor: '#1E1E24',
            borderWidth: 1,
            borderColor: '#2C2C35',
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: 12,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: '600',
              letterSpacing: -0.2,
            }}
          >
            + Quick Freestyle Session
          </Text>
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 12,
              fontWeight: '400',
            }}
            numberOfLines={1}
          >
            • Log as you climb • Untracked
          </Text>
        </Pressable>

        {/* ── 2. Dual Action Launch Pills ─────────────────────── */}
        <Text
          style={{
            color: '#8A8A98',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.2,
            marginBottom: 12,
          }}
          className="uppercase"
        >
          ROUTINES & DRILLS
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Left Pill: + New Routine */}
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.push('/routines/editor');
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 46,
              borderRadius: 12,
              backgroundColor: '#1E1E24',
              borderWidth: 1,
              borderColor: '#2C2C35',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Plus size={16} color="#8E7CFF" strokeWidth={2.5} />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              New Routine
            </Text>
          </Pressable>

          {/* Right Pill: Beta Templates / Browse Drills */}
          <Pressable
            onPress={handleBrowseDrills}
            style={({ pressed }) => ({
              flex: 1,
              height: 46,
              borderRadius: 12,
              backgroundColor: '#1E1E24',
              borderWidth: 1,
              borderColor: '#2C2C35',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Compass size={16} color="#8A8A98" />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              Browse Drills
            </Text>
          </Pressable>
        </View>

        {/* ── 3. My Routines Section ─────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
            }}
            className="uppercase"
          >
            MY ROUTINES ({myRoutines.length})
          </Text>
        </View>

        {/* My Routines List / Empty State */}
        {myRoutines.length === 0 ? (
          <View
            style={{
              backgroundColor: '#17171C',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#2C2C35',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: '#8A8A98',
                textAlign: 'center',
                lineHeight: 18,
              }}
            >
              No custom routines yet. Build your first drill or launch a community template below.
            </Text>
          </View>
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

        {/* ── 4. Example Templates / Community Drills ────────── */}
        <View
          onLayout={(e) => {
            setDrillsY(e.nativeEvent.layout.y);
          }}
          style={{
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
            }}
            className="uppercase"
          >
            COMMUNITY & BENCHMARK DRILLS ({exampleTemplates.length})
          </Text>
        </View>

        {exampleTemplates.map((routine) => (
          <RoutineLaunchCard
            key={routine.id}
            routine={routine}
            onStart={handleStartRoutine}
            onEdit={handleEditRoutine}
            onDuplicate={handleDuplicateRoutine}
            onDelete={handleDeleteRoutine}
          />
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
