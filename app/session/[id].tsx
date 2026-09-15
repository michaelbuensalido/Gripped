import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import { SessionHeader } from '../../components/session/SessionHeader';
import { BoulderGroupCard } from '../../components/session/BoulderGroupCard';
import { FloatingRestTimer } from '../../components/session/FloatingRestTimer';
import { SessionCompletionModal } from '../../components/session/SessionCompletionModal';
import { BetaCamModal } from '../../components/session/BetaCamModal';
import { BetaPreviewModal } from '../../components/session/BetaPreviewModal';
import { ValidationFailureReason } from '../../services/videoAnalyzer';
import { triggerHaptic } from '../../utils/haptics';
import { getAllRoutinesWithBlocks } from '../../db/routineQueries';
import { ScreenContainer } from '../../components/ui/ScreenContainer';

export default function ActiveSessionScreen() {
  const {
    id,
    showWrapUp,
    wrapUpNonce,
    testBetaCam,
    testBetaReview,
    testBetaPreview,
    attachSampleBeta,
    testSetGrader,
    testAngle,
    testPicker,
    testRestTimer,
    testRestDuration,
    testValidationFailure,
    testValidationPassed,
  } = useLocalSearchParams<{
    id: string;
    showWrapUp?: string;
    wrapUpNonce?: string;
    testBetaCam?: string;
    testBetaReview?: string;
    testBetaPreview?: string;
    attachSampleBeta?: string;
    testSetGrader?: string;
    testAngle?: string;
    testPicker?: string;
    testRestTimer?: string;
    testRestDuration?: string;
    testValidationFailure?: string;
    testValidationPassed?: string;
  }>();
  const router = useRouter();

  // Keep screen awake while active workout view is mounted ("Mat Mode")
  useKeepAwake();

  const activeSession = useSessionStore((s) => s.activeSession);
  const groups = useSessionStore((s) => s.groups);
  const loadSession = useSessionStore((s) => s.loadSession);
  const startSessionFromRoutine = useSessionStore((s) => s.startSessionFromRoutine);
  const startEmptySession = useSessionStore((s) => s.startEmptySession);
  const addGroup = useSessionStore((s) => s.addGroup);
  const completeSession = useSessionStore((s) => s.completeSession);
  const discardSession = useSessionStore((s) => s.discardSession);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pausedEndTime, setPausedEndTime] = useState<number>(Date.now());
  const [testCamOpen, setTestCamOpen] = useState(false);
  const [testPreviewOpen, setTestPreviewOpen] = useState(false);

  // Load session if not already in store (e.g. coming back from background)
  useEffect(() => {
    if (id === 'active') {
      const timer = setTimeout(() => {
        const current = useSessionStore.getState().activeSession;
        if (current) {
          router.replace({
            pathname: '/session/[id]',
            params: {
              id: current.id,
              showWrapUp: showWrapUp || '0',
              wrapUpNonce: wrapUpNonce || '',
              testBetaCam: testBetaCam || '',
              testBetaReview: testBetaReview || '',
              testBetaPreview: testBetaPreview || '',
              attachSampleBeta: attachSampleBeta || '',
              testSetGrader: testSetGrader || '',
              testAngle: testAngle || '',
              testPicker: testPicker || '',
              testRestTimer: testRestTimer || '',
              testRestDuration: testRestDuration || '',
              testValidationFailure: testValidationFailure || '',
              testValidationPassed: testValidationPassed || '',
            },
          });
        } else {
          const routines = getAllRoutinesWithBlocks();
          const newId =
            routines.length > 0
              ? startSessionFromRoutine(routines[0], routines[0].title)
              : startEmptySession('Crux Climbing Gym');
          router.replace({
            pathname: '/session/[id]',
            params: {
              id: newId,
              showWrapUp: showWrapUp || '0',
              wrapUpNonce: wrapUpNonce || '',
              testBetaCam: testBetaCam || '',
              testBetaReview: testBetaReview || '',
              testBetaPreview: testBetaPreview || '',
              attachSampleBeta: attachSampleBeta || '',
              testSetGrader: testSetGrader || '',
              testAngle: testAngle || '',
              testPicker: testPicker || '',
              testRestTimer: testRestTimer || '',
              testRestDuration: testRestDuration || '',
              testValidationFailure: testValidationFailure || '',
              testValidationPassed: testValidationPassed || '',
            },
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (!activeSession || activeSession.id !== id) {
      loadSession(id);
    }
  }, [id, showWrapUp, wrapUpNonce, testBetaCam, testBetaReview, testBetaPreview, attachSampleBeta, testRestTimer, testRestDuration, testValidationFailure, testValidationPassed]);

  useEffect(() => {
    if (showWrapUp === '1') {
      setPausedEndTime(Date.now());
      setShowCompletionModal(true);
    }
  }, [showWrapUp, wrapUpNonce]);

  useEffect(() => {
    if (
      testBetaCam === '1' ||
      testBetaReview === '1' ||
      testSetGrader === '1' ||
      !!testValidationFailure ||
      testValidationPassed === '1'
    ) {
      setTestCamOpen(true);
      setTestPreviewOpen(false);
    } else if (testBetaPreview === '1') {
      setTestCamOpen(false);
      setTestPreviewOpen(true);
    } else {
      setTestCamOpen(false);
      setTestPreviewOpen(false);
    }

    if (testRestTimer === '1') {
      const dur = testRestDuration ? Number(testRestDuration) : 45;
      useSessionStore.getState().triggerRestTimer(dur);
    }

    if (attachSampleBeta === '1' && groups.length > 0 && groups[0].logs.length > 0) {
      const firstLog = groups[0].logs[0];
      useSessionStore.getState().commitSetGrading(
        groups[0].id,
        firstLog.id,
        {
          gradeRaw: 'V6',
          mediaUri: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80',
          mediaType: 'photo',
          notes: 'Wall: 45° Steep Cave / Roof • Estimated: V6',
        }
      );
    }
  }, [testBetaCam, testBetaReview, testBetaPreview, attachSampleBeta, testSetGrader, testValidationFailure, testValidationPassed, groups]);

  const handleFinish = useCallback(() => {
    setPausedEndTime(Date.now());
    triggerHaptic('success');
    setShowCompletionModal(true);
  }, []);

  const handleSaveCompletion = useCallback(
    (data: {
      title: string;
      gymName: string;
      notes: string;
      rpe: number | null;
      mediaUris: string[];
      endTime: number;
    }) => {
      const targetId = id || activeSession?.id;
      completeSession(data);
      setShowCompletionModal(false);
      if (targetId) {
        router.replace(`/session/detail/${targetId}`);
      } else {
        router.replace('/');
      }
    },
    [completeSession, router, id, activeSession]
  );

  const handleDiscardCompletion = useCallback(() => {
    discardSession();
    setShowCompletionModal(false);
    router.replace('/');
  }, [discardSession, router]);

  /** Dismiss the full-screen session view but keep the session alive in the store */
  const handleMinimize = useCallback(() => {
    router.replace('/');
  }, [router]);

  const handleAddZone = useCallback(() => {
    addGroup();
  }, [addGroup]);

  if (!activeSession) {
    return (
      <ScreenContainer withTopInset={false}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-secondary text-sm font-semibold">Loading session…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer withTopInset={false}>
      {/* Sticky header */}
      <SessionHeader onFinish={handleFinish} onMinimize={handleMinimize} />

      {/* Scrollable content with keyboard avoidance */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 190 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Boulder group cards */}
          {groups.map((group, index) => (
            <BoulderGroupCard
              key={group.id}
              groupId={group.id}
              zoneName={group.zoneName}
              logs={group.logs}
              defaultRestSeconds={group.defaultRestSeconds}
              notes={group.notes}
              index={index}
              totalGroups={groups.length}
            />
          ))}

          {/* Add Zone button */}
          <TouchableOpacity
            onPress={handleAddZone}
            activeOpacity={0.8}
            style={{
              borderColor: '#2C2C35',
              backgroundColor: '#1E1E24',
            }}
            className="flex-row items-center justify-center gap-2 mx-4 h-[52px] rounded-2xl border border-dashed mt-2"
          >
            <Plus size={18} color="#8E7CFF" strokeWidth={2.5} />
            <Text className="text-white font-bold text-sm">Add Wall Zone</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating rest timer overlay */}
      <FloatingRestTimer />

      {/* Post-session completion wrap-up modal */}
      <SessionCompletionModal
        visible={showCompletionModal}
        activeSession={activeSession}
        groups={groups}
        pausedEndTime={pausedEndTime}
        onSave={handleSaveCompletion}
        onDiscard={handleDiscardCompletion}
      />

      {/* Global / Test Beta Cam & Preview Modals */}
      <BetaCamModal
        visible={testCamOpen}
        autoSimulatorBypass={
          testBetaCam === '1' ||
          testBetaReview === '1' ||
          testSetGrader === '1' ||
          !!testValidationFailure ||
          testValidationPassed === '1'
        }
        testReview={testBetaReview === '1'}
        testSetGrader={testSetGrader === '1'}
        testAngle={testAngle ? Number(testAngle) : undefined}
        testPickerOpen={testPicker === '1'}
        testValidationFailure={testValidationFailure as ValidationFailureReason}
        testValidationPassed={testValidationPassed === '1'}
        onClose={() => setTestCamOpen(false)}
        onAttach={(uri, type, gradeRaw, notes) => {
          if (groups.length > 0 && groups[0].logs.length > 0) {
            if (gradeRaw) {
              useSessionStore.getState().commitSetGrading(groups[0].id, groups[0].logs[0].id, {
                gradeRaw,
                mediaUri: uri,
                mediaType: type,
                notes,
              });
            } else {
              useSessionStore.getState().updateSetMedia(groups[0].id, groups[0].logs[0].id, uri, type);
            }
          }
          setTestCamOpen(false);
        }}
        gradeLabel={groups[0]?.logs[0]?.gradeRaw || 'V4'}
        setIndex={1}
      />

      <BetaPreviewModal
        visible={testPreviewOpen}
        mediaUri="https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80"
        mediaType="photo"
        setIndex={1}
        gradeRaw={groups[0]?.logs[0]?.gradeRaw || 'V4'}
        outcome={groups[0]?.logs[0]?.outcome || 'send'}
        onClose={() => setTestPreviewOpen(false)}
        onRetake={() => {
          setTestPreviewOpen(false);
          setTestCamOpen(true);
        }}
        onDelete={() => {
          if (groups.length > 0 && groups[0].logs.length > 0) {
            useSessionStore.getState().updateSetMedia(groups[0].id, groups[0].logs[0].id, null, null);
          }
          setTestPreviewOpen(false);
        }}
      />
    </ScreenContainer>
  );
}
