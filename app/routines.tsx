import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Zap,
  Layers,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react-native';
import {
  getAllRoutinesWithBlocks,
  duplicateRoutine,
  deleteRoutine,
} from '../db/routineQueries';
import type { RoutineWithBlocks } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { RoutineCard } from '../components/routines/RoutineCard';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { THEME_COLORS } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';

export default function RoutinesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 180,
        }}
      >
        {/* ── 1. Top Header Area & Settings Button ────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingTop: 6,
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: '700',
                letterSpacing: -0.5,
              }}
            >
              Training Routines
            </Text>

            <Text
              style={{
                color: '#8A8A98',
                fontSize: 13,
                fontWeight: '400',
                marginTop: 4,
              }}
            >
              Structured climbing workouts & templates
            </Text>
          </View>

          {/* Settings Gear Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#1E1E24',
              borderWidth: 1,
              borderColor: '#2C2C35',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon size={20} color="#9A9AA6" />
          </TouchableOpacity>
        </View>

        {/* ── 2. "Start Empty Session" Tactile Quick-Start Card ── */}
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            handleStartEmpty();
          }}
          style={({ pressed }) => ({
            backgroundColor: '#1E1E24',
            borderWidth: 1,
            borderColor: '#2C2C35',
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
            opacity: pressed ? 0.92 : 1,
          })}
        >
          {/* Left: 40x40pt rounded-xl badge in Lavender tint with Zap icon */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(142, 124, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={20} color="#8E7CFF" fill="#8E7CFF" />
          </View>

          {/* Center: Title & Subtitle */}
          <View style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: -0.2,
              }}
            >
              Start Empty Session
            </Text>
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 12,
                fontWeight: '400',
                marginTop: 2,
              }}
            >
              Freestyle climb • Log as you go
            </Text>
          </View>

          {/* Right: Subtle chevron */}
          <ChevronRight size={18} color="#5A5A65" />
        </Pressable>

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
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1.2,
            }}
            className="uppercase"
          >
            MY ROUTINES ({myRoutines.length})
          </Text>

          {/* "+ New Routine" Button */}
          <TouchableOpacity
            onPress={() => router.push('/routines/editor')}
            activeOpacity={0.75}
            style={{
              backgroundColor: THEME_COLORS.cardSurface,
              borderColor: THEME_COLORS.cardBorder,
              borderTopColor: 'rgba(255, 255, 255, 0.14)',
              borderWidth: 1,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Plus size={13} color="#8E7CFF" strokeWidth={2.5} />
            <Text style={{ color: '#8E7CFF', fontSize: 12, fontWeight: '700' }}>
              New Routine
            </Text>
          </TouchableOpacity>
        </View>

        {/* My Routines List / Empty State */}
        {myRoutines.length === 0 ? (
          <View
            style={{
              backgroundColor: '#1E1E24',
              borderWidth: 1,
              borderColor: '#2C2C35',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            {/* 56x56pt container, surface #17171C, border 1px #2C2C35, rounded-2xl */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: '#17171C',
                borderWidth: 1,
                borderColor: '#2C2C35',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={24} color="#8E7CFF" strokeWidth={1.8} />
            </View>

            {/* Text: 17pt Bold White, text-center, mt-3, mb-1 */}
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginTop: 12,
                marginBottom: 4,
                letterSpacing: -0.2,
              }}
            >
              Build Your First Routine
            </Text>

            {/* Description: 13pt #8A8A98, text-center, leading-relaxed, px-2, mb-5 */}
            <Text
              style={{
                fontSize: 13,
                color: '#8A8A98',
                textAlign: 'center',
                lineHeight: 19,
                paddingHorizontal: 8,
                marginBottom: 20,
              }}
            >
              Create structured 4x4 endurance drills, limit bouldering circuits, or custom hangboard intervals.
            </Text>

            {/* Prominent Solid Pill Button */}
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/routines/editor');
              }}
              style={({ pressed }) => ({
                height: 44,
                borderRadius: 22,
                backgroundColor: '#8E7CFF',
                paddingHorizontal: 24,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#8E7CFF',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
                transform: [{ scale: pressed ? 0.95 : 1 }],
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}
              >
                + Create Routine
              </Text>
            </Pressable>
          </View>
        ) : (
          myRoutines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onStart={handleStartRoutine}
              onEdit={handleEditRoutine}
              onDuplicate={handleDuplicateRoutine}
              onDelete={handleDeleteRoutine}
            />
          ))
        )}

        {/* ── 4. Example Templates Section ───────────────────── */}
        <View
          style={{
            marginTop: 4,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1.2,
            }}
            className="uppercase"
          >
            EXAMPLE TEMPLATES ({exampleTemplates.length})
          </Text>
        </View>

        {exampleTemplates.map((routine) => (
          <RoutineCard
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
