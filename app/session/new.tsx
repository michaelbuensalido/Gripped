import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useSessionStore } from '../../store/sessionStore';

export default function NewSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [gymName, setGymName] = useState('');
  const startSession = useSessionStore((s) => s.startSession);
  const activeSession = useSessionStore((s) => s.activeSession);

  const handleStart = () => {
    startSession(gymName.trim() || 'My Gym');
    // After store sets session, navigate to it
    const session = useSessionStore.getState().activeSession;
    if (session) {
      router.replace(`/session/${session.id}`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
    >
      {/* Back */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="p-4"
        activeOpacity={0.7}
      >
        <ArrowLeft size={22} color="#9CA3AF" />
      </TouchableOpacity>

      <View className="flex-1 px-6 pt-8">
        <Text className="text-white text-3xl font-black mb-2">New Session</Text>
        <Text className="text-secondary text-base mb-10">
          Where are you climbing today?
        </Text>

        {/* Gym name input */}
        <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 border border-border gap-3">
          <MapPin size={18} color="#7C3AED" />
          <TextInput
            value={gymName}
            onChangeText={setGymName}
            placeholder="Gym name (optional)"
            placeholderTextColor="#4B5563"
            returnKeyType="done"
            className="flex-1 text-white text-base"
            style={{ color: '#FFFFFF' }}
            autoFocus
          />
        </View>
      </View>

      {/* Start button */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <TouchableOpacity
          onPress={handleStart}
          activeOpacity={0.85}
          className="bg-accent py-4 rounded-2xl items-center"
        >
          <Text className="text-white text-lg font-black">Start Climbing 🧗</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
