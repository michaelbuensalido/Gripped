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
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { seedDemoData } from '../db/seed';
import { clearAllSessionData } from '../db/queries';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { getHapticsEnabled, setHapticsEnabled, HAPTICS_STORAGE_KEY } from '../utils/haptics';
import { useCelebrationStore } from '../store/celebrationStore';
import { triggerHaptic } from '../utils/haptics';

const REST_TIMER_KEY = '@cruxlog/rest_timer_seconds';
const DEFAULT_REST = 90;

function SettingsRow({
  label,
  sublabel,
  right,
  isLast,
}: {
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  isLast?: boolean;
}) {
  const { colors, type, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: space.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, marginRight: space.md }}>
        <Text style={[type.heading, { color: colors.text }]}>{label}</Text>
        {sublabel ? (
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{sublabel}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius } = useTheme();

  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST);
  const [restInput, setRestInput] = useState(String(DEFAULT_REST));
  const [haptics, setHaptics] = useState(getHapticsEnabled());
  const { celebrationsEnabled, setCelebrationsEnabled } = useCelebrationStore();

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
    if (val) triggerHaptic('light');
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
      'This will permanently delete all sessions, climbs, and projects. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            try {
              triggerHaptic('heavy');
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, space.lg),
          paddingHorizontal: space.lg,
          paddingBottom: space.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: colors.text }]}>Settings</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 140,
          gap: space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Rest Timer */}
        <View>
          <SectionHeader title="Rest Timer" />
          <Card>
            <SettingsRow
              label="Default Rest Duration"
              sublabel="Seconds between climbs (10–600)"
              right={
                <TextInput
                  value={restInput}
                  onChangeText={setRestInput}
                  onBlur={() => saveRestTimer(restInput)}
                  onSubmitEditing={() => saveRestTimer(restInput)}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={[
                    type.statSm,
                    {
                      color: colors.accentText,
                      backgroundColor: colors.cardMuted,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: space.sm,
                      paddingVertical: 6,
                      minHeight: 44,
                      minWidth: 64,
                      textAlign: 'center',
                    },
                  ]}
                />
              }
            />

            {/* Presets */}
            <View style={{ flexDirection: 'row', gap: space.sm, paddingTop: space.md }}>
              {REST_PRESETS.map((s) => {
                const isSelected = restSeconds === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      triggerHaptic('light');
                      setRestSeconds(s);
                      setRestInput(String(s));
                      AsyncStorage.setItem(REST_TIMER_KEY, String(s));
                    }}
                    style={{
                      flex: 1,
                      height: 56,
                      minHeight: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? colors.accentSoft : colors.cardMuted,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : colors.border,
                    }}
                  >
                    <Text
                      style={[
                        type.heading,
                        {
                          color: isSelected ? colors.accentText : colors.textMuted,
                          fontSize: 15,
                        },
                      ]}
                    >
                      {s}s
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Feedback & Celebrations */}
        <View>
          <SectionHeader title="Feedback & Celebrations" />
          <Card>
            <SettingsRow
              label="Haptic Feedback"
              sublabel="Vibration cues during logging"
              right={
                <Switch
                  value={haptics}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: colors.cardMuted, true: colors.accent }}
                  thumbColor={colors.textOnAccent}
                />
              }
            />
            <SettingsRow
              label="Celebrations & Animations"
              sublabel="Visual effects for flashes & topped projects"
              isLast
              right={
                <Switch
                  value={celebrationsEnabled}
                  onValueChange={setCelebrationsEnabled}
                  trackColor={{ false: colors.cardMuted, true: colors.accent }}
                  thumbColor={colors.textOnAccent}
                />
              }
            />
          </Card>
        </View>

        {/* About */}
        <View>
          <SectionHeader title="About" />
          <Card>
            <SettingsRow
              label="Grade System"
              sublabel="V-Scale (Hueco) with Font mapping"
              right={<Text style={[type.body, { color: colors.textMuted }]}>V0 – V16</Text>}
            />
            <SettingsRow
              label="Storage"
              sublabel="Offline-first SQLite local store"
              isLast
              right={<Text style={[type.body, { color: colors.flashText }]}>Local</Text>}
            />
          </Card>
        </View>

        {/* Data Tools */}
        <View>
          <SectionHeader title="Data Management" />
          <Card>
            <TouchableOpacity
              onPress={handleClearData}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingVertical: space.sm,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.dangerSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color={colors.dangerText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.dangerText }]}>Clear All Session Data</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Permanently deletes all logs and sessions
                </Text>
              </View>
            </TouchableOpacity>

            {__DEV__ && (
              <View style={{ marginTop: space.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md }}>
                <PrimaryButton
                  label="RESET & SEED DEMO DATA"
                  onPress={() => {
                    Alert.alert(
                      'Seed Demo Data',
                      'This will delete existing data and populate 10 weeks of realistic climbing history. Proceed?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Seed Data',
                          style: 'destructive',
                          onPress: () => {
                            try {
                              seedDemoData();
                              Alert.alert('Success', 'Demo climbing data seeded.');
                            } catch (e) {
                              Alert.alert('Error', 'Could not seed demo data.');
                            }
                          },
                        },
                      ]
                    );
                  }}
                />
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
