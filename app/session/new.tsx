import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useSessionStore } from '../../store/sessionStore';
import { useTheme } from '../../theme/useTheme';

export default function NewSessionScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const [gymName, setGymName] = useState('');
  const startQuickSession = useSessionStore((s) => s.startQuickSession);

  const handleStart = () => {
    startQuickSession(gymName.trim() || 'My Gym');
    router.replace('/session/active');
  };

  return (
    <Screen title="New Session" subtitle="Where are you climbing today?" scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, marginTop: space.xl }}>
        <View style={{ flex: 1 }}>
          <View style={{
            backgroundColor: colors.cardMuted,
            borderRadius: radius.md,
            padding: space.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
          }}>
            <MapPin size={20} color={colors.textMuted} />
            <TextInput
              value={gymName}
              onChangeText={setGymName}
              placeholder="Gym name (e.g. Boulder World)"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              style={[{ color: colors.text, flex: 1 }, type.body]}
              autoFocus
            />
          </View>
        </View>

        <View style={{ paddingBottom: space.xxl }}>
          <PrimaryButton label="START CLIMBING" onPress={handleStart} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
