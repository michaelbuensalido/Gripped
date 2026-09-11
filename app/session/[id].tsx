import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import { SessionHeader } from '../../components/session/SessionHeader';
import { BoulderGroupCard } from '../../components/session/BoulderGroupCard';
import { FloatingRestTimer } from '../../components/session/FloatingRestTimer';
import { SessionCompletionModal } from '../../components/session/SessionCompletionModal';
import { triggerHaptic } from '../../utils/haptics';
import { getAllRoutinesWithBlocks } from '../../db/routineQueries';
import { ScreenContainer } from '../../components/ui/ScreenContainer';

export default function ActiveSessionScreen() {
  const { id, showWrapUp, wrapUpNonce } = useLocalSearchParams<{
    id: string;
    showWrapUp?: string;
    wrapUpNonce?: string;
  }>();
  const router = useRouter();

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

  // Load session if not already in store (e.g. coming back from background)
  useEffect(() => {
    if (id === 'active') {
      const current = useSessionStore.getState().activeSession;
      if (current) {
        router.replace({
          pathname: '/session/[id]',
          params: {
            id: current.id,
            showWrapUp: showWrapUp || '0',
            wrapUpNonce: wrapUpNonce || '',
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
          },
        });
      }
    } else if (!activeSession || activeSession.id !== id) {
      loadSession(id);
    }
  }, [id, showWrapUp, wrapUpNonce]);

  useEffect(() => {
    if (showWrapUp === '1') {
      setPausedEndTime(Date.now());
      setShowCompletionModal(true);
    }
  }, [showWrapUp, wrapUpNonce]);

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

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 190 }}
        keyboardShouldPersistTaps="handled"
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
    </ScreenContainer>
  );
}
