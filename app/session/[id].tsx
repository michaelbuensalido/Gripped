import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  LayoutAnimation,
} from 'react-native';
import { useKeepAwake, activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Plus } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import { SessionHeader } from '../../components/session/SessionHeader';
import { SessionConditionStrip } from '../../components/session/SessionConditionStrip';
import { BoulderGroupCard } from '../../components/session/BoulderGroupCard';
import { SessionCompletionModal } from '../../components/session/SessionCompletionModal';
import { BetaCameraRecorder } from '../../components/media/BetaCameraRecorder';
import { attachBetaClipToSet } from '../../services/db/sessionQueries';
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

  useEffect(() => {
    activateKeepAwakeAsync('active-session').catch(() => {});
    return () => {
      deactivateKeepAwake('active-session').catch(() => {});
    };
  }, []);

  const activeSession = useSessionStore((s) => s.activeSession);
  const groups = useSessionStore((s) => s.groups);
  const conditions = useSessionStore((s) => s.conditions);
  const loadSession = useSessionStore((s) => s.loadSession);
  const startSessionFromRoutine = useSessionStore((s) => s.startSessionFromRoutine);
  const startEmptySession = useSessionStore((s) => s.startEmptySession);
  const addGroup = useSessionStore((s) => s.addGroup);
  const completeSession = useSessionStore((s) => s.completeSession);
  const discardSession = useSessionStore((s) => s.discardSession);
  const setSessionConditions = useSessionStore((s) => s.setSessionConditions);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pausedEndTime, setPausedEndTime] = useState<number>(Date.now());
  const [testCamOpen, setTestCamOpen] = useState(false);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [testPreviewOpen, setTestPreviewOpen] = useState(false);
  const [isDraggingCards, setIsDraggingCards] = useState(false);

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
      setTestCamOpen(true); setActiveSetId(null);;
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
      deactivateKeepAwake('active-session').catch(() => {});
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
    Alert.alert(
      'Discard Session?',
      'Are you sure you want to discard this session? All logged sends from this workout will be lost.',
      [
        { text: 'Keep Climbing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            deactivateKeepAwake('active-session').catch(() => {});
            discardSession();
            setShowCompletionModal(false);
            router.replace('/');
          },
        },
      ]
    );
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

      {/* Scrollable content with keyboard avoidance and tap dismissal */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <DraggableFlatList
            data={groups}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setIsDraggingCards(false);
              const reorderGroups = useSessionStore.getState().reorderGroups;
              if (reorderGroups) {
                reorderGroups(data.map(g => g.id));
              }
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 170 }}
            ListHeaderComponent={
              <SessionConditionStrip
                selected={conditions}
                onChange={setSessionConditions}
              />
            }
            renderItem={({ item, drag, isActive }) => (
              <ScaleDecorator>
                <BoulderGroupCard
                  key={item.id}
                  groupId={item.id}
                  zoneName={item.zoneName}
                  logs={item.logs}
                  defaultRestSeconds={item.defaultRestSeconds}
                  notes={item.notes}
                  index={item.order}
                  totalGroups={groups.length}
                  drag={drag}
                  isActive={isActive}
                  forceCollapse={isDraggingCards}
                  onHoldBegin={() => {
                    triggerHaptic('light');
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsDraggingCards(true);
                  }}
                  onHoldEnd={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsDraggingCards(false);
                  }}
                />
              </ScaleDecorator>
            )}
            ListFooterComponent={
              <TouchableOpacity
                onPress={handleAddZone}
                activeOpacity={0.8}
                style={{
                  borderColor: '#27272F',
                  backgroundColor: '#19191D',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 44,
                  borderRadius: 8,
                  borderWidth: 1,
                  marginTop: 8,
                }}
              >
                <Plus size={16} color="#555562" strokeWidth={2.5} />
                <Text style={{ color: '#555562', fontWeight: '700', fontSize: 12, letterSpacing: 1.2 }}>ADD ZONE</Text>
              </TouchableOpacity>
            }
          />
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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
      <BetaCameraRecorder
        visible={testCamOpen}
        onClose={() => setTestCamOpen(false)}
        setId={activeSetId}
        onBetaRecorded={async (videoUri: string, evaluation: any) => {
          if (activeSetId) {
            await attachBetaClipToSet(
              activeSetId,
              videoUri,
              evaluation.cruxTimestampMs,
              evaluation.metrics?.hangTimeSeconds
            );
          }
          setTestCamOpen(false);
        }}
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
          setTestCamOpen(true); setActiveSetId(null);;
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
