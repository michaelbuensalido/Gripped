import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  X,
} from 'lucide-react-native';
import Reanimated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/ui/Card';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ScalePressable } from '../components/ui/ScalePressable';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import {
  clearAllData,
  exportDataToJSON,
  getStorageUsage,
  importDataFromJSON,
} from '../db/queries';
import { seedDemoData } from '../db/seed';
import { useCelebrationStore } from '../store/celebrationStore';
import { useTheme } from '../theme/useTheme';
import {
  getHapticsEnabled,
  HAPTICS_STORAGE_KEY,
  setHapticsEnabled,
  triggerHaptic,
} from '../utils/haptics';
import { GradeSystem, UnitSystem, usePreferences } from '../utils/preferences';

const REST_TIMER_KEY = '@cruxlog/rest_timer_seconds';
const DEFAULT_REST = 90;
const REST_PRESETS = [60, 90, 120, 180] as const;

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  accessibilityLabel: string;
}

interface SlidingSegmentedControlProps<T extends string> {
  options: [SegmentOption<T>, SegmentOption<T>];
  value: T;
  onChange: (next: T) => void;
}

/**
 * Spring-driven segmented control.
 * Animates only `transform: [{ translateX }]` on the UI thread via Reanimated worklets,
 * respecting reduced-motion preferences and retargeting smoothly if interrupted mid-flight.
 */
function SlidingSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SlidingSegmentedControlProps<T>) {
  const { colors, type, space, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = options[0].value === value ? 0 : 1;
  const thumbX = useSharedValue(0);

  const innerPadding = space.xs;
  const segmentWidth = trackWidth > 0 ? (trackWidth - innerPadding * 2) / 2 : 0;

  useEffect(() => {
    if (segmentWidth <= 0) return;
    const target = activeIndex * segmentWidth;
    if (reduceMotion) {
      thumbX.value = target;
    } else {
      thumbX.value = withSpring(target, {
        damping: 24,
        stiffness: 320,
        mass: 0.7,
      });
    }
  }, [activeIndex, segmentWidth, reduceMotion, thumbX]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  return (
    <View
      onLayout={handleLayout}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.cardMuted,
        padding: innerPadding,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        position: 'relative',
      }}
    >
      {segmentWidth > 0 ? (
        <Reanimated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: innerPadding,
              bottom: innerPadding,
              left: innerPadding,
              width: segmentWidth,
              borderRadius: radius.sm,
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            },
            thumbStyle,
          ]}
        />
      ) : null}

      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <ScalePressable
            key={option.value}
            onPress={() => {
              if (option.value !== value) {
                triggerHaptic('light');
                onChange(option.value);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{ selected: isSelected }}
            style={{
              flex: 1,
              height: 40,
              minHeight: 40,
              borderRadius: radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                type.control,
                {
                  color: isSelected ? colors.text : colors.textMuted,
                },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </ScalePressable>
        );
      })}
    </View>
  );
}

interface GroupLabelProps {
  title: string;
}

function GroupLabel({ title }: GroupLabelProps) {
  const { colors, type, space } = useTheme();
  return (
    <Text
      style={[
        type.caption,
        {
          color: colors.textMuted,
          marginBottom: space.sm,
          paddingHorizontal: space.xs,
        },
      ]}
    >
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius } = useTheme();
  const { gradeSystem, unitSystem, setGradeSystem, setUnitSystem } = usePreferences();

  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST);
  const [restInput, setRestInput] = useState(String(DEFAULT_REST));
  const [haptics, setHaptics] = useState(getHapticsEnabled());
  const { celebrationsEnabled, setCelebrationsEnabled } = useCelebrationStore();

  // Storage usage
  const [storageFormatted, setStorageFormatted] = useState('...');
  const [storageBreakdown, setStorageBreakdown] = useState('');

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [detectedBackups, setDetectedBackups] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const appBuild = Constants.expoConfig?.ios?.buildNumber ?? '1';

  const refreshStorage = useCallback(async () => {
    try {
      let mediaBytes = 0;
      const docDir = (FileSystem as any)?.documentDirectory;
      if (docDir) {
        try {
          const files = await FileSystem.readDirectoryAsync(docDir);
          for (const f of files) {
            try {
              const info = await FileSystem.getInfoAsync(docDir + f);
              if (info.exists && 'size' in info && typeof info.size === 'number') {
                mediaBytes += info.size;
              }
            } catch {}
          }
        } catch {}
      }
      const usage = getStorageUsage(mediaBytes);
      setStorageFormatted(usage.formatted);
      const dbKb = Math.round(usage.dbBytes / 1024);
      const mediaKb = Math.round(usage.mediaBytes / 1024);
      setStorageBreakdown(`${dbKb} KB database, ${mediaKb} KB media`);
    } catch {
      setStorageFormatted('Local');
    }
  }, []);

  const loadLocalBackups = useCallback(async () => {
    try {
      const docDir = (FileSystem as any)?.documentDirectory;
      if (docDir) {
        const files = await FileSystem.readDirectoryAsync(docDir);
        const backups = files.filter(
          (f) =>
            (f.startsWith('gripped-export-') || f.startsWith('cruxlog-export-')) &&
            f.endsWith('.json')
        );
        setDetectedBackups(backups);
      }
    } catch {}
  }, []);

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

      refreshStorage();
      loadLocalBackups();
    }, [refreshStorage, loadLocalBackups])
  );

  const handleToggleHaptics = useCallback((val: boolean) => {
    setHaptics(val);
    setHapticsEnabled(val);
    if (val) triggerHaptic('light');
  }, []);

  const saveRestTimer = useCallback(
    (value: string) => {
      const n = parseInt(value, 10);
      if (!isNaN(n) && n >= 10 && n <= 600) {
        setRestSeconds(n);
        AsyncStorage.setItem(REST_TIMER_KEY, String(n));
      } else {
        setRestInput(String(restSeconds));
      }
    },
    [restSeconds]
  );

  const handleExportData = async () => {
    try {
      triggerHaptic('medium');
      const jsonStr = await exportDataToJSON();
      const parsed = JSON.parse(jsonStr);
      const sessionCount = Array.isArray(parsed.sessions) ? parsed.sessions.length : 0;
      const climbCount = Array.isArray(parsed.climbs) ? parsed.climbs.length : 0;
      const fileName = `gripped-export-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      refreshStorage();
      loadLocalBackups();

      Alert.alert(
        'Export Summary',
        `Exported ${sessionCount} sessions and ${climbCount} climbs.`,
        [
          {
            text: 'Share / Save File',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { dialogTitle: 'Export Gripped Data' });
              }
            },
          },
          { text: 'Done', style: 'cancel' },
        ]
      );
    } catch (e: any) {
      console.error('Export error:', e);
      Alert.alert('Export Failed', e?.message || String(e));
    }
  };

  const handleImportJson = async (jsonString: string) => {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      Alert.alert('Empty Input', 'Please paste valid backup JSON data.');
      return;
    }

    try {
      setIsImporting(true);
      const res = await importDataFromJSON(trimmed);
      triggerHaptic('success');
      setIsImportModalOpen(false);
      setImportJsonText('');
      refreshStorage();
      Alert.alert(
        'Import Successful',
        `Restored ${res.importedCount} records across ${res.tables.length} tables.`
      );
    } catch (err: any) {
      triggerHaptic('warning');
      Alert.alert('Import Failed', err?.message || 'Could not parse or restore backup.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportLocalFile = async (fileName: string) => {
    try {
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      Alert.alert(
        'Confirm Restore',
        `Restore data from "${fileName}"? Existing items with matching IDs will be overwritten.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'default',
            onPress: () => handleImportJson(content),
          },
        ]
      );
    } catch {
      Alert.alert('File Read Error', 'Could not read the selected backup file.');
    }
  };

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
              clearAllData();
              refreshStorage();
              Alert.alert('Done', 'All data has been cleared.');
            } catch {
              Alert.alert('Error', 'Could not clear data.');
            }
          },
        },
      ]
    );
  }, [refreshStorage]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Clean Header: No eyebrow, no decorative badges */}
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
        <ScalePressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 40,
            height: 40,
            minHeight: 40,
            minWidth: 40,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
        </ScalePressable>

        <Text style={[type.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.xs,
          paddingBottom: 120,
          gap: space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Climbing Controls */}
        <View>
          <GroupLabel title="Climbing" />
          <Card style={{ gap: space.lg }}>
            {/* Grade System */}
            <View style={{ gap: space.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={[type.heading, { color: colors.text }]}>Grade Scale</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  {gradeSystem === 'v_scale' ? 'Hueco (V0-V16)' : 'Fontainebleau (4-8C+)'}
                </Text>
              </View>

              <SlidingSegmentedControl<GradeSystem>
                value={gradeSystem}
                onChange={setGradeSystem}
                options={[
                  {
                    value: 'v_scale',
                    label: 'V-Scale',
                    accessibilityLabel: 'V-Scale grading system',
                  },
                  {
                    value: 'font',
                    label: 'Font',
                    accessibilityLabel: 'Fontainebleau grading system',
                  },
                ]}
              />
            </View>

            {/* Hairline Divider */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Units */}
            <View style={{ gap: space.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={[type.heading, { color: colors.text }]}>Units</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  {unitSystem === 'metric' ? 'kg, cm, m' : 'lbs, in, ft'}
                </Text>
              </View>

              <SlidingSegmentedControl<UnitSystem>
                value={unitSystem}
                onChange={setUnitSystem}
                options={[
                  {
                    value: 'metric',
                    label: 'Metric',
                    accessibilityLabel: 'Metric units',
                  },
                  {
                    value: 'imperial',
                    label: 'Imperial',
                    accessibilityLabel: 'Imperial units',
                  },
                ]}
              />
            </View>

            {/* Hairline Divider */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Rest Timer */}
            <View style={{ gap: space.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[type.heading, { color: colors.text }]}>Rest Timer</Text>
                  <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                    Default countdown between attempts (10-600s)
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.cardMuted,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: space.sm,
                    height: 40,
                  }}
                >
                  <TextInput
                    value={restInput}
                    onChangeText={setRestInput}
                    onBlur={() => saveRestTimer(restInput)}
                    onSubmitEditing={() => saveRestTimer(restInput)}
                    keyboardType="numeric"
                    returnKeyType="done"
                    accessibilityLabel="Default rest duration in seconds"
                    style={[
                      type.control,
                      {
                        color: colors.text,
                        minWidth: 36,
                        textAlign: 'right',
                        paddingVertical: 0,
                      },
                    ]}
                  />
                  <Text style={[type.caption, { color: colors.textMuted, marginLeft: 2 }]}>s</Text>
                </View>
              </View>

              {/* Single-line Preset Pills */}
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {REST_PRESETS.map((s) => {
                  const isSelected = restSeconds === s;
                  return (
                    <ScalePressable
                      key={s}
                      onPress={() => {
                        triggerHaptic('light');
                        setRestSeconds(s);
                        setRestInput(String(s));
                        AsyncStorage.setItem(REST_TIMER_KEY, String(s));
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${s} seconds rest preset`}
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        flex: 1,
                        height: 38,
                        minHeight: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? colors.accentSoft : colors.cardMuted,
                        borderRadius: radius.sm,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.glassBorder : colors.border,
                      }}
                    >
                      <Text
                        style={[
                          type.control,
                          {
                            color: isSelected ? colors.text : colors.textMuted,
                          },
                        ]}
                      >
                        {s}s
                      </Text>
                    </ScalePressable>
                  );
                })}
              </View>
            </View>
          </Card>
        </View>

        {/* 2. Feedback */}
        <View>
          <GroupLabel title="Feedback" />
          <Card style={{ paddingVertical: space.xs }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Haptics</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Tactile feedback when logging climbs and timers
                </Text>
              </View>
              <Switch
                value={haptics}
                onValueChange={handleToggleHaptics}
                trackColor={{ false: colors.cardMuted, true: colors.accent }}
                thumbColor={colors.textOnAccent}
                accessibilityLabel="Toggle haptic feedback"
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                gap: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Send Celebrations</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Milestone banners and confetti on flashes and sends
                </Text>
              </View>
              <Switch
                value={celebrationsEnabled}
                onValueChange={setCelebrationsEnabled}
                trackColor={{ false: colors.cardMuted, true: colors.accent }}
                thumbColor={colors.textOnAccent}
                accessibilityLabel="Toggle celebration effects"
              />
            </View>
          </Card>
        </View>

        {/* 3. Data & Storage */}
        <View>
          <GroupLabel title="Data & Backups" />
          <Card style={{ paddingVertical: space.xs }}>
            {/* Storage Row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Local Storage</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  {storageBreakdown || 'SQLite database and media cache'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text style={[type.control, { color: colors.textMuted }]}>
                  {storageFormatted}
                </Text>
                <ScalePressable
                  onPress={() => {
                    triggerHaptic('light');
                    refreshStorage();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh storage usage"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.sm,
                    backgroundColor: colors.cardMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw size={14} color={colors.textMuted} />
                </ScalePressable>
              </View>
            </View>

            {/* Export Backup */}
            <ScalePressable
              onPress={handleExportData}
              accessibilityRole="button"
              accessibilityLabel="Export all data as JSON"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Export Backup</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Save or share your climbing log as JSON
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </ScalePressable>

            {/* Restore Backup */}
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                loadLocalBackups();
                setIsImportModalOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Import data from JSON backup"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Restore from Backup</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Import sessions, climbs, and projects from JSON
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                {detectedBackups.length > 0 ? (
                  <Text style={[type.caption, { color: colors.textMuted }]}>
                    {detectedBackups.length} saved
                  </Text>
                ) : null}
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </ScalePressable>

            {/* Clear All Data */}
            <ScalePressable
              onPress={handleClearData}
              accessibilityRole="button"
              accessibilityLabel="Clear all data"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                gap: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.dangerText }]}>Clear All Data</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Permanently delete all local sessions and projects
                </Text>
              </View>
              <ChevronRight size={18} color={colors.dangerText} />
            </ScalePressable>
          </Card>
        </View>

        {/* 4. Legal & App Info */}
        <View>
          <GroupLabel title="About" />
          <Card style={{ paddingVertical: space.xs }}>
            <ScalePressable
              onPress={() => router.push('/privacy-policy' as any)}
              accessibilityRole="button"
              accessibilityLabel="Privacy Policy"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                gap: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Privacy Policy</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Offline-first architecture, zero cloud tracking
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </ScalePressable>
          </Card>

          {__DEV__ ? (
            <View style={{ marginTop: space.lg }}>
              <SecondaryButton
                label="Reset & Seed Demo Data"
                onPress={() => {
                  try {
                    triggerHaptic('medium');
                    seedDemoData();
                    refreshStorage();
                    Alert.alert('Done', 'Demo data has been loaded.');
                    router.replace('/');
                  } catch (e: any) {
                    console.error('Seed error:', e);
                    Alert.alert('Error', e?.message || String(e));
                  }
                }}
              />
            </View>
          ) : null}

          {/* Quiet Footer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.sm,
              marginTop: space.xl,
            }}
          >
            <Image
              source={require('../assets/logo.png')}
              style={{
                width: 20,
                height: 20,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
              resizeMode="cover"
              accessibilityLabel="Gripped Logo"
            />
            <Text style={[type.caption, { color: colors.textMuted }]}>
              Gripped {appVersion} ({appBuild})
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Restore Data Modal */}
      <Modal
        visible={isImportModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1,
            backgroundColor: colors.scrim,
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.materialBase,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: space.lg,
              paddingBottom: Math.max(insets.bottom, space.xl),
              maxHeight: '85%',
              borderTopWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            {/* Sheet Drag Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: colors.glassHighlight,
                alignSelf: 'center',
                marginBottom: space.md,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: space.md,
              }}
            >
              <Text style={[type.title, { color: colors.text }]}>Restore Data</Text>
              <ScalePressable
                onPress={() => setIsImportModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close restore modal"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: colors.cardMuted,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color={colors.textMuted} />
              </ScalePressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: space.md, paddingBottom: space.lg }}
            >
              {detectedBackups.length > 0 ? (
                <View style={{ gap: space.xs }}>
                  <Text style={[type.caption, { color: colors.textMuted, marginBottom: 2 }]}>
                    Saved Backups on Device
                  </Text>
                  {detectedBackups.map((file) => (
                    <ScalePressable
                      key={file}
                      onPress={() => handleImportLocalFile(file)}
                      accessibilityRole="button"
                      accessibilityLabel={`Restore from ${file}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.card,
                        padding: space.md,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space.sm,
                          flex: 1,
                        }}
                      >
                        <FileText size={16} color={colors.textMuted} />
                        <Text
                          style={[type.control, { color: colors.text, flex: 1 }]}
                          numberOfLines={1}
                        >
                          {file}
                        </Text>
                      </View>
                      <Text style={[type.control, { color: colors.accentText }]}>Restore</Text>
                    </ScalePressable>
                  ))}
                </View>
              ) : null}

              <View style={{ gap: space.xs }}>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  Paste Backup JSON
                </Text>
                <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.xs }]}>
                  Paste the contents of a Gripped backup file (.json) below:
                </Text>
                <TextInput
                  value={importJsonText}
                  onChangeText={setImportJsonText}
                  placeholder='{"version": 1, "sessions": [...], "climbs": [...]}'
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={6}
                  accessibilityLabel="Paste JSON backup data"
                  style={[
                    type.caption,
                    {
                      backgroundColor: colors.cardMuted,
                      color: colors.text,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: space.md,
                      minHeight: 140,
                      textAlignVertical: 'top',
                    },
                  ]}
                />
              </View>

              <PrimaryButton
                label={isImporting ? 'Restoring...' : 'Restore from JSON'}
                onPress={() => handleImportJson(importJsonText)}
                disabled={isImporting}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
