import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Zap } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useSessionStore } from '../../store/sessionStore';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';

const PRESET_GYMS = [
  'Outdoor / Other',
  'Home Wall',
  'Local Gym',
];

export default function SelectGymScreen() {
  const router = useRouter();
  const { colors, type, space, radius, shadow } = useTheme();
  const [gymName, setGymName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const startQuickSession = useSessionStore((s) => s.startQuickSession);

  const handleStart = () => {
    const name = selectedPreset ?? gymName.trim() ?? 'My Gym';
    if (!name) return;
    triggerHaptic('medium');
    startQuickSession(name);
    router.replace('/session/active');
  };

  const handlePresetSelect = (name: string) => {
    triggerHaptic('light');
    setSelectedPreset(name);
    setGymName('');
  };

  return (
    <Screen title="Select Gym" subtitle="Where are you climbing today?" scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, marginTop: space.lg }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingBottom: 140 }}>
          <SectionHeader title="Quick Select" />
          {PRESET_GYMS.map((gym) => {
            const isSelected = selectedPreset === gym;
            return (
              <TouchableOpacity
                key={gym}
                onPress={() => handlePresetSelect(gym)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    {
                      backgroundColor: isSelected ? colors.accentSoft : colors.card,
                      borderRadius: radius.md,
                      paddingVertical: space.lg,
                      paddingHorizontal: space.lg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.accent : 'transparent',
                    },
                    isSelected ? {} : shadow.card,
                  ]}
                >
                  <MapPin size={18} color={isSelected ? colors.accent : colors.textMuted} />
                  <Text
                    style={[
                      type.heading,
                      { color: isSelected ? colors.accentText : colors.text },
                    ]}
                  >
                    {gym}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <SectionHeader title="Or enter a name" style={{ marginTop: space.lg }} />
          <View
            style={{
              backgroundColor: colors.cardMuted,
              borderRadius: radius.md,
              paddingHorizontal: space.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
            }}
          >
            <MapPin size={18} color={colors.textMuted} />
            <TextInput
              value={gymName}
              onChangeText={(t) => {
                setGymName(t);
                setSelectedPreset(null);
              }}
              placeholder="e.g. Boulder World"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleStart}
              style={[
                type.body,
                {
                  flex: 1,
                  color: colors.text,
                  paddingVertical: space.md,
                },
              ]}
            />
          </View>
        </ScrollView>

        <View style={{ paddingBottom: space.xl }}>
          <PrimaryButton
            icon={<Zap color={colors.textOnAccent} size={18} />}
            label="START CLIMBING"
            onPress={handleStart}
            disabled={!selectedPreset && !gymName.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
