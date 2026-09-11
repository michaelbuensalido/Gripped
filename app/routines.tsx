import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Zap,
  Layers,
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
import { FLOATING_CARD_STYLE, THEME_COLORS } from '../constants/theme';

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
          paddingTop: 8,
          paddingBottom: 180,
        }}
      >
        {/* ── 1. Top Header Area ────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 6, marginBottom: 20 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 34,
              fontWeight: '700',
              letterSpacing: -0.5,
            }}
          >
            Training Routines
          </Text>

          <Text
            style={{
              color: '#9A9AA6',
              fontSize: 14,
              fontWeight: '400',
              marginTop: 4,
            }}
          >
            Structured climbing workouts & templates
          </Text>
        </View>

        {/* ── 2. Top Action Area ("Instant Freestyle Session Launcher") ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleStartEmpty}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#8E7CFF',
              height: 52,
              borderRadius: 26,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#8E7CFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              START EMPTY SESSION
            </Text>
          </TouchableOpacity>

          {/* Subtext / Helper */}
          <Text
            style={{
              color: '#8E8E9A',
              fontSize: 12,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Untracked freestyle climb • Log as you go
          </Text>
        </View>

        {/* ── 3. My Routines Section ─────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
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
            style={[
              FLOATING_CARD_STYLE,
              {
                marginHorizontal: 16,
                marginBottom: 24,
                paddingVertical: 24,
                paddingHorizontal: 20,
                alignItems: 'center',
              },
            ]}
          >
            {/* Unboxed, floating 3D graphic */}
            <Image
              source={require('../assets/illustrations/chalk_bag_empty_state.png')}
              style={{
                width: 140,
                height: 80,
                borderRadius: 16,
                marginBottom: 14,
              }}
              resizeMode="cover"
            />

            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '700',
                marginBottom: 6,
              }}
            >
              No custom routines yet
            </Text>
            <Text
              style={{
                color: '#9A9AA6',
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 20,
                lineHeight: 18,
                paddingHorizontal: 10,
              }}
            >
              Build your own structured climbing session with customized grades, burn targets, and rest timers, or duplicate an example template below.
            </Text>

            {/* Secondary CTA: Floating dark pill with subtle white border and 13pt SemiBold white text */}
            <TouchableOpacity
              onPress={() => router.push('/routines/editor')}
              activeOpacity={0.75}
              style={{
                backgroundColor: THEME_COLORS.cardSurface,
                borderColor: 'rgba(255, 255, 255, 0.14)',
                borderWidth: 1,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                Create Custom Routine
              </Text>
            </TouchableOpacity>
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
            paddingHorizontal: 16,
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
