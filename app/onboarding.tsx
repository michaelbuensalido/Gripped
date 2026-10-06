import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius } = useTheme();
  const [step, setStep] = useState(1);
  const [gradeSystem, setGradeSystem] = useState('V-Scale');
  
  const handleComplete = async () => {
    await AsyncStorage.setItem('@cruxlog/onboarded', 'true');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm }}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={{ padding: space.xs }}>
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
            <Text style={[type.body, { color: colors.textMuted, marginBottom: space['2xl'] }]}>Which grading system does your home gym use?</Text>
            
            {['V-Scale', 'Fontainebleau'].map((sys) => (
              <TouchableOpacity 
                key={sys}
                onPress={() => setGradeSystem(sys)}
                style={{ 
                  backgroundColor: gradeSystem === sys ? colors.accentSoft : colors.card,
                  borderWidth: 1,
                  borderColor: gradeSystem === sys ? colors.accent : colors.border,
                  padding: space.lg,
                  borderRadius: radius.md,
                  marginBottom: space.md
                }}
              >
                <Text style={[type.heading, { color: gradeSystem === sys ? colors.accent : colors.text }]}>{sys}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {step === 2 && (
          <View>
            <Text style={[type.display, { color: colors.text, marginBottom: space.sm }]}>Experience Level</Text>
            <Text style={[type.body, { color: colors.textMuted, marginBottom: space['2xl'] }]}>This helps us tailor your insights.</Text>
            
            {['Beginner (V0 - V2)', 'Intermediate (V3 - V5)', 'Advanced (V6 - V8)', 'Expert (V9+)'].map((lvl) => (
              <TouchableOpacity 
                key={lvl}
                onPress={() => setStep(3)}
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: space.lg,
                  borderRadius: radius.md,
                  marginBottom: space.md
                }}
              >
                <Text style={[type.heading, { color: colors.text }]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[type.display, { color: colors.text, marginBottom: space.sm }]}>You're all set.</Text>
            <Text style={[type.body, { color: colors.textMuted, marginBottom: space['2xl'] }]}>Ready to log your first session.</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={{ paddingHorizontal: space.xl, paddingBottom: Math.max(insets.bottom, space.lg) }}>
        <PrimaryButton 
          label={step === 3 ? "Start Climbing" : "Next"} 
          onPress={() => step < 3 ? setStep(step + 1) : handleComplete()}
        />
      </View>
    </View>
  );
}
