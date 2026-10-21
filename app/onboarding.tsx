import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check, MapPin } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  usePreferences,
  GradeSystem,
  ExperienceLevel,
} from '../utils/preferences';
import { getRecentGyms, insertGym } from '../db/queries';
import { triggerHaptic } from '../utils/haptics';

const GRADE_OPTIONS: { id: GradeSystem; title: string; subtitle: string }[] = [
  { id: 'v_scale', title: 'V-Scale (Hueco)', subtitle: 'V0, V3, V6, V10 — North America & global indoor standard' },
  { id: 'font', title: 'Fontainebleau (Font)', subtitle: '4, 6A, 7A, 7C+ — European bouldering scale' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius } = useTheme();
  const {
    gradeSystem,
    experienceLevel,
    homeGym,
    setGradeSystem,
    setExperienceLevel,
    setHomeGym,
  } = usePreferences();

  const [step, setStep] = useState(1);
  const [selectedSystem, setSelectedSystem] = useState<GradeSystem>(gradeSystem);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>(experienceLevel);
  const [selectedGym, setSelectedGym] = useState<string>(homeGym || '');

  const localGyms = useMemo(() => {
    try {
      return getRecentGyms().filter(Boolean);
    } catch {
      return [];
    }
  }, []);

  const experienceOptions: { id: ExperienceLevel; title: string; range: string }[] =
    selectedSystem === 'font'
      ? [
          { id: 'beginner', title: 'Beginner', range: '4 – 5+ · Building movement fundamentals' },
          { id: 'intermediate', title: 'Intermediate', range: '6A – 6C+ · Projecting overhang & technical styles' },
          { id: 'advanced', title: 'Advanced / Expert', range: '7A+ · Pushing limit boulders & micro-beta' },
        ]
      : [
          { id: 'beginner', title: 'Beginner', range: 'V0 – V2 · Building movement fundamentals' },
          { id: 'intermediate', title: 'Intermediate', range: 'V3 – V5 · Projecting overhang & technical styles' },
          { id: 'advanced', title: 'Advanced / Expert', range: 'V6+ · Pushing limit boulders & micro-beta' },
        ];

  const handleComplete = async (skipGym = false) => {
    triggerHaptic('success');
    await setGradeSystem(selectedSystem);
    await setExperienceLevel(selectedLevel);
    const gymToSave = skipGym ? null : selectedGym.trim() || null;
    if (gymToSave) {
      insertGym(gymToSave);
    }
    await setHomeGym(gymToSave);
    await AsyncStorage.setItem('@cruxlog/onboarded', 'true');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm }}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          style={{ padding: space.xs }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[type.label, { color: colors.textMuted, flex: 1, textAlign: 'center', marginRight: 32 }]}>
          STEP {step} OF 3
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: Math.max(insets.bottom, space.xl) }}>
        {step === 1 && (
          <View>
            <Text style={[type.display, { color: colors.text, marginBottom: space.sm }]}>Grade System</Text>
            <Text style={[type.body, { color: colors.textMuted, marginBottom: space.xxl }]}>
              Which grading system does your home gym use? You can change this anytime in Settings.
            </Text>

            {GRADE_OPTIONS.map((opt) => {
              const active = selectedSystem === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedSystem(opt.id);
                  }}
                  style={{
                    backgroundColor: active ? colors.accentSoft : colors.card,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    padding: space.lg,
                    borderRadius: radius.lg,
                    marginBottom: space.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: space.md }}>
                    <Text style={[type.heading, { color: active ? colors.accent : colors.text }]}>{opt.title}</Text>
                    <Text style={[type.caption, { color: colors.textMuted, marginTop: 4 }]}>{opt.subtitle}</Text>
                  </View>
                  {active && <Check size={20} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[type.display, { color: colors.text, marginBottom: space.sm }]}>Experience Level</Text>
            <Text style={[type.body, { color: colors.textMuted, marginBottom: space.xxl }]}>
              This calibrates your default grade rail and training telemetry.
            </Text>

            {experienceOptions.map((lvl) => {
              const active = selectedLevel === lvl.id;
              return (
                <TouchableOpacity
                  key={lvl.id}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedLevel(lvl.id);
                  }}
                  style={{
                    backgroundColor: active ? colors.accentSoft : colors.card,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    padding: space.lg,
                    borderRadius: radius.lg,
                    marginBottom: space.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: space.md }}>
                    <Text style={[type.heading, { color: active ? colors.accent : colors.text }]}>{lvl.title}</Text>
                    <Text style={[type.caption, { color: colors.textMuted, marginTop: 4 }]}>{lvl.range}</Text>
                  </View>
                  {active && <Check size={20} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[type.display, { color: colors.text, marginBottom: space.sm }]}>Home Gym</Text>
            <Text style={[type.body, { color: colors.textMuted, marginBottom: space.lg }]}>
              Pick your primary climbing gym for 1-tap session starts, or skip for now.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: space.md,
                height: 52,
                marginBottom: space.lg,
                gap: space.sm,
              }}
            >
              <MapPin size={18} color={colors.textMuted} />
              <TextInput
                value={selectedGym}
                onChangeText={setSelectedGym}
                placeholder="Type your home gym name..."
                placeholderTextColor={colors.textMuted}
                style={[type.body, { flex: 1, color: colors.text }]}
              />
            </View>

            {localGyms.length > 0 && (
              <View>
                <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>POPULAR GYMS</Text>
                <View style={{ gap: space.sm }}>
                  {localGyms.map((gymName) => {
                    const active = selectedGym.toLowerCase() === gymName.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={gymName}
                        onPress={() => {
                          triggerHaptic('selection');
                          setSelectedGym(gymName);
                        }}
                        style={{
                          backgroundColor: active ? colors.accentSoft : colors.card,
                          borderWidth: 1,
                          borderColor: active ? colors.accent : colors.border,
                          paddingVertical: space.md,
                          paddingHorizontal: space.lg,
                          borderRadius: radius.md,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={[type.heading, { color: active ? colors.accent : colors.text }]}>{gymName}</Text>
                        {active && <Check size={18} color={colors.accent} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: space.xl, paddingBottom: Math.max(insets.bottom, space.lg), gap: space.sm }}>
        <PrimaryButton
          label={step === 3 ? 'Start Climbing' : 'Continue'}
          onPress={() => {
            triggerHaptic('light');
            if (step < 3) {
              setStep(step + 1);
            } else {
              handleComplete(false);
            }
          }}
        />
        {step === 3 && (
          <SecondaryButton label="Skip for now" onPress={() => handleComplete(true)} />
        )}
      </View>
    </View>
  );
}
