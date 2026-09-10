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
import { Settings, Clock, Trash2, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { getDatabase } from '../db/schema';
import { FLOATING_CARD_STYLE } from '../constants/theme';
import { ScreenContainer } from '../components/ui/ScreenContainer';

const REST_TIMER_KEY = '@cruxlog/rest_timer_seconds';
const DEFAULT_REST = 90;

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="text-muted text-xs font-bold uppercase tracking-widest px-4 mt-6 mb-2">
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
    <View className="flex-row items-center justify-between px-4 py-4 border-b border-border/40">
      <View className="flex-1 mr-4">
        <Text className="text-white font-semibold">{label}</Text>
        {sublabel ? <Text className="text-muted text-xs mt-0.5">{sublabel}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST);
  const [restInput, setRestInput] = useState(String(DEFAULT_REST));
  const [haptics, setHaptics] = useState(true);

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
    }, [])
  );

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
              const db = getDatabase();
              db.execSync('DELETE FROM boulder_logs; DELETE FROM boulder_groups; DELETE FROM sessions;');
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
          <Settings size={22} color="#A78BFA" />
          <Text className="text-white text-2xl font-black">Settings</Text>
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
              className="text-accentLight font-bold text-right text-base w-14"
              style={{ color: '#A78BFA' }}
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
              className={`px-3 py-1.5 rounded-full border ${
                restSeconds === s ? 'bg-accent border-accent' : 'bg-surface/60 border-border'
              }`}
            >
              <Text className={`text-sm font-bold ${restSeconds === s ? 'text-white' : 'text-secondary'}`}>
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
              onValueChange={setHaptics}
              trackColor={{ false: '#333339', true: '#7C3AED' }}
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
