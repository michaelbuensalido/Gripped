import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Clock, Trash2, Info, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { clearAllSessionData } from '../db/queries';
import { FLOATING_CARD_STYLE, THEME_COLORS } from '../constants/theme';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { getHapticsEnabled, setHapticsEnabled, HAPTICS_STORAGE_KEY } from '../utils/haptics';

const REST_TIMER_KEY = '@cruxlog/rest_timer_seconds';
const DEFAULT_REST = 90;

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="text-[#8A8A98] text-[11px] font-bold uppercase tracking-[1.2px] px-4 mt-6 mb-2.5">
      {label}
    </Text>
  );
}

function SettingsRow({
  label,
  sublabel,
  right,
}: {
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-4 border-b border-[#2C2C35]/60">
      <View className="flex-1 mr-4">
        <Text className="text-white font-semibold">{label}</Text>
        {sublabel ? <Text className="text-[#9A9AA6] text-xs mt-0.5">{sublabel}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST);
  const [restInput, setRestInput] = useState(String(DEFAULT_REST));
  const [haptics, setHaptics] = useState(getHapticsEnabled());

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(REST_TIMER_KEY).then((val) => {
        if (val) {
          const n = parseInt(val, 10);
          if (!isNaN(n)) {
            setRestSeconds(n);
            setRestInput(String(n));
          }
        }
      });

      AsyncStorage.getItem(HAPTICS_STORAGE_KEY).then((val) => {
        if (val !== null) {
          setHaptics(val === 'true');
        }
      });
    }, [])
  );

  const handleToggleHaptics = useCallback((val: boolean) => {
    setHaptics(val);
    setHapticsEnabled(val);
  }, []);

  const saveRestTimer = useCallback((value: string) => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 10 && n <= 600) {
      setRestSeconds(n);
      AsyncStorage.setItem(REST_TIMER_KEY, String(n));
    } else {
      setRestInput(String(restSeconds));
    }
  }, [restSeconds]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data?',
      'This will permanently delete all sessions, sets, and logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            try {
              clearAllSessionData();
              Alert.alert('Done', 'All data has been cleared.');
            } catch (e) {
              Alert.alert('Error', 'Could not clear data.');
            }
          },
        },
      ]
    );
  }, []);

  const REST_PRESETS = [60, 90, 120, 180];

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center gap-3 mb-1">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: THEME_COLORS.cardSurface,
                borderColor: THEME_COLORS.cardBorder,
                borderTopColor: 'rgba(255, 255, 255, 0.14)',
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-3xl font-black tracking-tight">Settings</Text>
            </View>
          </View>
          <Text className="text-[#9A9AA6] text-sm ml-13">Configure preferences and manage data</Text>
        </View>

      {/* Timer section */}
      <SectionHeader label="Rest Timer" />
      <View style={FLOATING_CARD_STYLE} className="rounded-2xl mx-4 overflow-hidden">
        <SettingsRow
          label="Default Rest Duration"
          sublabel="Seconds between sets (10–600)"
          right={
            <TextInput
              value={restInput}
              onChangeText={setRestInput}
              onBlur={() => saveRestTimer(restInput)}
              onSubmitEditing={() => saveRestTimer(restInput)}
              keyboardType="numeric"
              returnKeyType="done"
              className="font-bold text-right text-base w-14"
              style={{ color: '#8E7CFF' }}
            />
          }
        />
        {/* Preset pills */}
        <View className="px-4 py-3 flex-row gap-2">
          {REST_PRESETS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                setRestSeconds(s);
                setRestInput(String(s));
                AsyncStorage.setItem(REST_TIMER_KEY, String(s));
              }}
              activeOpacity={0.75}
              style={{
                backgroundColor: restSeconds === s ? '#8E7CFF' : THEME_COLORS.cardSurface,
                borderColor: restSeconds === s ? '#8E7CFF' : THEME_COLORS.cardBorder,
                borderTopColor: restSeconds === s ? '#8E7CFF' : 'rgba(255, 255, 255, 0.14)',
                borderWidth: 1,
              }}
              className="px-3 py-1.5 rounded-full"
            >
              <Text className={`text-sm font-bold ${restSeconds === s ? 'text-white' : 'text-[#9A9AA6]'}`}>
                {s}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Feedback section */}
      <SectionHeader label="Feedback" />
      <View style={FLOATING_CARD_STYLE} className="rounded-2xl mx-4 overflow-hidden">
        <SettingsRow
          label="Haptic Feedback"
          sublabel="Vibrate on grade/outcome changes"
          right={
            <Switch
              value={haptics}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: '#333339', true: '#8E7CFF' }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      {/* About section */}
      <SectionHeader label="About" />
      <View style={FLOATING_CARD_STYLE} className="rounded-2xl mx-4 overflow-hidden">
        <SettingsRow label="CruxLog" sublabel="Indoor bouldering tracker" right={
          <Text className="text-muted text-sm">v1.0</Text>
        } />
        <SettingsRow label="Grade System" sublabel="V-Scale (Hueco)" right={
          <Text className="text-secondary text-sm">V0 – V13</Text>
        } />
      </View>

      {/* Danger zone */}
      <SectionHeader label="Data" />
      <View style={FLOATING_CARD_STYLE} className="rounded-2xl mx-4 overflow-hidden">
        <TouchableOpacity
          onPress={handleClearData}
          activeOpacity={0.8}
          className="flex-row items-center gap-3 px-4 py-4"
        >
          <Trash2 size={18} color="#EF4444" />
          <View>
            <Text className="text-red-400 font-semibold">Clear All Session Data</Text>
            <Text className="text-muted text-xs mt-0.5">Permanently deletes all logs</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </ScreenContainer>
  );
}
