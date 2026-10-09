import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius } = useTheme();

  const handleGetStarted = () => {
    router.push('/onboarding');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('@cruxlog/onboarded', 'true');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ImageBackground
        source={require('../assets/speckled_mat_bg.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: colors.backdropImageOpacity }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, paddingHorizontal: space.xl, paddingBottom: Math.max(insets.bottom, space.xl), paddingTop: insets.top + space['2xl'], justifyContent: 'space-between' }}>
        <View style={{ marginTop: space['2xl'] }}>
          <Text style={[type.display, { color: colors.text, fontSize: 40, marginBottom: space.sm }]}>
            CruxLog
          </Text>
          <Text style={[type.heading, { color: colors.textMuted, fontSize: 18 }]}>
            Your premium bouldering ledger.
          </Text>
        </View>

        <View style={{ gap: space.md }}>
          <PrimaryButton 
            label="Get Started" 
            onPress={handleGetStarted}
          />
          <TouchableOpacity 
            onPress={handleSkip}
            style={{ paddingVertical: space.sm, alignItems: 'center' }}
          >
            <Text style={[type.control, { color: colors.accentText }]}>Skip setup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
