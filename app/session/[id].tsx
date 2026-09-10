import React, { useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';
import { SessionHeader } from '../../components/session/SessionHeader';
import { BoulderGroupCard } from '../../components/session/BoulderGroupCard';
import { FloatingRestTimer } from '../../components/session/FloatingRestTimer';

export default function ActiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const activeSession = useSessionStore((s) => s.activeSession);
  const groups = useSessionStore((s) => s.groups);
  const loadSession = useSessionStore((s) => s.loadSession);
  const addGroup = useSessionStore((s) => s.addGroup);
  const finishSession = useSessionStore((s) => s.finishSession);

  // Load session if not already in store (e.g. coming back from background)
  useEffect(() => {
    if (!activeSession || activeSession.id !== id) {
      loadSession(id);
    }
  }, [id]);

  const handleFinish = useCallback(() => {
    Alert.alert(
      'Finish Session?',
      'This will end your session and save all sets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'destructive',
          onPress: () => {
            finishSession();
            router.replace('/');
          },
        },
      ]
    );
  }, [finishSession, router]);

  const handleAddZone = useCallback(() => {
    addGroup();
  }, [addGroup]);

  if (!activeSession) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-secondary">Loading session…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Sticky header */}
      <SessionHeader onFinish={handleFinish} />

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Boulder group cards */}
        {groups.map((group) => (
          <BoulderGroupCard
            key={group.id}
            groupId={group.id}
            zoneName={group.zoneName}
            logs={group.logs}
          />
        ))}

        {/* Add Zone button */}
        <TouchableOpacity
          onPress={handleAddZone}
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 mx-4 py-4 rounded-2xl border border-dashed border-border mt-2"
        >
          <Plus size={18} color="#9CA3AF" />
          <Text className="text-secondary font-semibold">Add Zone</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating rest timer overlay */}
      <FloatingRestTimer />
    </View>
  );
}
