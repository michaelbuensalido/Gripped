import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import { THEME_COLORS, FLOATING_CARD_STYLE } from '../../constants/theme';
import { getRoutineById, getAllRoutinesWithBlocks } from '../../db/routineQueries';
import { ScreenContainer } from '../../components/ui/ScreenContainer';

export default function NewSessionScreen() {
  const router = useRouter();
  const { routineId, startEmpty, testRoutine, wrapUp } = useLocalSearchParams<{
    routineId?: string;
    startEmpty?: string;
    testRoutine?: string;
    wrapUp?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [gymName, setGymName] = useState('');
  const startSession = useSessionStore((s) => s.startSession);
  const startSessionFromRoutine = useSessionStore((s) => s.startSessionFromRoutine);
  const startEmptySession = useSessionStore((s) => s.startEmptySession);
  const hasLaunchedRef = React.useRef(false);

  useEffect(() => {
    if (wrapUp === '1') {
      const currentActive = useSessionStore.getState().activeSession;
      if (currentActive) {
        router.replace(`/session/${currentActive.id}?showWrapUp=1`);
      } else {
        const routines = getAllRoutinesWithBlocks();
        const sessionId = routines.length > 0
          ? startSessionFromRoutine(routines[0], routines[0].title)
          : startEmptySession('Crux Climbing Gym');
        router.replace(`/session/${sessionId}?showWrapUp=1`);
      }
      return;
    }

    if (startEmpty === '1') {
      const sessionId = startEmptySession('Gym Session');
      router.replace(`/session/${sessionId}`);
      return;
    }

    if (testRoutine === '1') {
      const routines = getAllRoutinesWithBlocks();
      if (routines.length > 0) {
        const sessionId = startSessionFromRoutine(routines[0], routines[0].title);
        router.replace(`/session/${sessionId}`);
        return;
      }
    }

    if (hasLaunchedRef.current) return;

    if (routineId) {
      hasLaunchedRef.current = true;
      const routine = getRoutineById(routineId);
      if (routine) {
        const sessionId = startSessionFromRoutine(routine, routine.title);
        router.replace(`/session/${sessionId}`);
      }
    }
  }, [routineId, startEmpty, testRoutine, wrapUp, startSessionFromRoutine, startEmptySession, router]);

  const handleStart = () => {
    startSession(gymName.trim() || 'My Gym');
    // After store sets session, navigate to it
    const session = useSessionStore.getState().activeSession;
    if (session) {
      router.replace(`/session/${session.id}`);
    }
  };

  return (
    <ScreenContainer withTopInset={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-4"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="flex-1 px-6 pt-4">
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 34,
              fontWeight: '700',
              letterSpacing: -0.5,
              marginBottom: 4,
            }}
          >
            New Session
          </Text>
          <Text
            style={{
              color: '#9A9AA6',
              fontSize: 14,
              fontWeight: '400',
              marginBottom: 28,
            }}
          >
            Where are you climbing today?
          </Text>

          {/* Gym name input */}
          <View
            style={[
              FLOATING_CARD_STYLE,
              {
                borderRadius: 20,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              },
            ]}
          >
            <MapPin size={20} color="#8E7CFF" />
            <TextInput
              value={gymName}
              onChangeText={setGymName}
              placeholder="Gym name (e.g. Boulder World)"
              placeholderTextColor="#555562"
              returnKeyType="done"
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                flex: 1,
              }}
              autoFocus
            />
          </View>
        </View>

        {/* Start button */}
        <View className="px-6" style={{ paddingBottom: insets.bottom + 24 }}>
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#8E7CFF',
              height: 52,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#8E7CFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              START CLIMBING
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
