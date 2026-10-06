import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius } = useTheme();

  const handleLogin = async () => {
    await AsyncStorage.setItem('@cruxlog/onboarded', 'true');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: space.xs }}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, padding: space.xl }}>
        <Text style={[type.display, { color: colors.text, marginBottom: space['2xl'] }]}>Welcome back.</Text>
        
        <View style={{ marginBottom: space.xl }}>
          <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>EMAIL</Text>
          <TextInput 
            style={{ backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontFamily: type.body.fontFamily }} 
            placeholder="you@example.com" 
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={{ marginBottom: space['2xl'] }}>
          <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>PASSWORD</Text>
          <TextInput 
            style={{ backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontFamily: type.body.fontFamily }} 
            placeholder="••••••••" 
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
        </View>
        
        <PrimaryButton label="Log In" onPress={handleLogin} />
      </View>
    </View>
  );
}
