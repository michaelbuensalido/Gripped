import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  Upload,
  HardDrive,
  RefreshCw,
  Info,
  Shield,
  Layers,
  Ruler,
  Check,
  X,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { seedDemoData } from '../db/seed';
import { clearAllData, exportDataToJSON, importDataFromJSON, getStorageUsage } from '../db/queries';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { ScalePressable } from '../components/ui/ScalePressable';
import { getHapticsEnabled, setHapticsEnabled, HAPTICS_STORAGE_KEY, triggerHaptic } from '../utils/haptics';
import { useCelebrationStore } from '../store/celebrationStore';
import { usePreferences, GradeSystem, UnitSystem } from '../utils/preferences';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

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
  const { gradeSystem, unitSystem, setGradeSystem, setUnitSystem } = usePreferences();

  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST);
  const [restInput, setRestInput] = useState(String(DEFAULT_REST));
  const [haptics, setHaptics] = useState(getHapticsEnabled());
  const { celebrationsEnabled, setCelebrationsEnabled } = useCelebrationStore();

  // Storage usage
  const [storageFormatted, setStorageFormatted] = useState('Calculating...');
  const [dbSizeFormatted, setDbSizeFormatted] = useState('');
  const [isRefreshingStorage, setIsRefreshingStorage] = useState(false);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [detectedBackups, setDetectedBackups] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const refreshStorage = useCallback(async () => {
    setIsRefreshingStorage(true);
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
      setDbSizeFormatted(`SQLite: ${dbKb} KB • Cache: ${mediaKb} KB`);
    } catch {
      setStorageFormatted('Local');
    } finally {
      setIsRefreshingStorage(false);
    }
  }, []);

  const loadLocalBackups = useCallback(async () => {
    try {
      const docDir = (FileSystem as any)?.documentDirectory;
      if (docDir) {
        const files = await FileSystem.readDirectoryAsync(docDir);
        const backups = files.filter(f => (f.startsWith('gripped-export-') || f.startsWith('cruxlog-export-')) && f.endsWith('.json'));
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

  const saveRestTimer = useCallback((value: string) => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 10 && n <= 600) {
      setRestSeconds(n);
      AsyncStorage.setItem(REST_TIMER_KEY, String(n));
    } else {
      setRestInput(String(restSeconds));
    }
  }, [restSeconds]);

  const handleExportData = async () => {
    try {
      triggerHaptic('medium');
      const jsonStr = await exportDataToJSON();
      const parsed = JSON.parse(jsonStr);
      const sessionCount = Array.isArray(parsed.sessions) ? parsed.sessions.length : 0;
      const climbCount = Array.isArray(parsed.climbs) ? parsed.climbs.length : 0;
      const fileName = `gripped-export-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonStr, { encoding: FileSystem.EncodingType.UTF8 });
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
      const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
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
    } catch (e) {
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
            } catch (e) {
              Alert.alert('Error', 'Could not clear data.');
            }
          },
        },
      ]
    );
  }, [refreshStorage]);

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
        <ScalePressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 48,
            height: 48,
            minHeight: 48,
            minWidth: 48,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </ScalePressable>
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: colors.text }]}>Settings</Text>
        </View>
      </View>

      <Reanimated.ScrollView
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
                  accessibilityLabel="Default rest duration in seconds"
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
                  </ScalePressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Climbing Preferences */}
        <View>
          <SectionHeader title="Climbing Preferences" />
          <Card>
            {/* Grade System */}
            <View style={{ paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs }}>
                <Text style={[type.heading, { color: colors.text }]}>Grade System</Text>
                <Text style={[type.caption, { color: colors.accentText, fontWeight: '600' }]}>
                  {gradeSystem === 'v_scale' ? 'V0 – V16' : '4 – 8C+'}
                </Text>
              </View>
              <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.sm }]}>
                Choose between Hueco (V-Scale) and Fontainebleau (Font)
              </Text>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <ScalePressable
                  onPress={() => {
                    triggerHaptic('light');
                    setGradeSystem('v_scale');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="V-Scale grading system"
                  accessibilityState={{ selected: gradeSystem === 'v_scale' }}
                  style={{
                    flex: 1,
                    height: 48,
                    minHeight: 48,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: gradeSystem === 'v_scale' ? colors.accentSoft : colors.cardMuted,
                    borderWidth: 1,
                    borderColor: gradeSystem === 'v_scale' ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={[
                      type.control,
                      {
                        color: gradeSystem === 'v_scale' ? colors.accentText : colors.textMuted,
                        fontWeight: gradeSystem === 'v_scale' ? '700' : '500',
                      },
                    ]}
                  >
                    V-Scale (Hueco)
                  </Text>
                </ScalePressable>

                <ScalePressable
                  onPress={() => {
                    triggerHaptic('light');
                    setGradeSystem('font');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Fontainebleau grading system"
                  accessibilityState={{ selected: gradeSystem === 'font' }}
                  style={{
                    flex: 1,
                    height: 48,
                    minHeight: 48,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: gradeSystem === 'font' ? colors.accentSoft : colors.cardMuted,
                    borderWidth: 1,
                    borderColor: gradeSystem === 'font' ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={[
                      type.control,
                      {
                        color: gradeSystem === 'font' ? colors.accentText : colors.textMuted,
                        fontWeight: gradeSystem === 'font' ? '700' : '500',
                      },
                    ]}
                  >
                    Font (Fontainebleau)
                  </Text>
                </ScalePressable>
              </View>
            </View>

            {/* Units */}
            <View style={{ paddingVertical: space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs }}>
                <Text style={[type.heading, { color: colors.text }]}>Units</Text>
                <Text style={[type.caption, { color: colors.accentText, fontWeight: '600' }]}>
                  {unitSystem === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, in)'}
                </Text>
              </View>
              <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.sm }]}>
                Measurement system for climber telemetry and wall dimensions
              </Text>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <ScalePressable
                  onPress={() => {
                    triggerHaptic('light');
                    setUnitSystem('metric');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Metric units"
                  accessibilityState={{ selected: unitSystem === 'metric' }}
                  style={{
                    flex: 1,
                    height: 48,
                    minHeight: 48,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: unitSystem === 'metric' ? colors.accentSoft : colors.cardMuted,
                    borderWidth: 1,
                    borderColor: unitSystem === 'metric' ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={[
                      type.control,
                      {
                        color: unitSystem === 'metric' ? colors.accentText : colors.textMuted,
                        fontWeight: unitSystem === 'metric' ? '700' : '500',
                      },
                    ]}
                  >
                    Metric (kg / cm)
                  </Text>
                </ScalePressable>

                <ScalePressable
                  onPress={() => {
                    triggerHaptic('light');
                    setUnitSystem('imperial');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Imperial units"
                  accessibilityState={{ selected: unitSystem === 'imperial' }}
                  style={{
                    flex: 1,
                    height: 48,
                    minHeight: 48,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: unitSystem === 'imperial' ? colors.accentSoft : colors.cardMuted,
                    borderWidth: 1,
                    borderColor: unitSystem === 'imperial' ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={[
                      type.control,
                      {
                        color: unitSystem === 'imperial' ? colors.accentText : colors.textMuted,
                        fontWeight: unitSystem === 'imperial' ? '700' : '500',
                      },
                    ]}
                  >
                    Imperial (lbs / in)
                  </Text>
                </ScalePressable>
              </View>
            </View>
          </Card>
        </View>

        {/* Feedback & Celebrations */}
        <View>
          <SectionHeader title="Feedback & Celebrations" />
          <Card>
            <SettingsRow
              label="Haptic Feedback"
              sublabel="Vibration cues during logging and timers"
              right={
                <Switch
                  value={haptics}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: colors.cardMuted, true: colors.accent }}
                  thumbColor={colors.textOnAccent}
                  accessibilityLabel="Toggle haptic feedback"
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
                  accessibilityLabel="Toggle celebration effects"
                />
              }
            />
          </Card>
        </View>

        {/* Data Management */}
        <View>
          <SectionHeader title="Data Management" />
          <Card>
            {/* Storage Usage Row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1, marginRight: space.md }}>
                <Text style={[type.heading, { color: colors.text }]}>Storage Usage</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  {dbSizeFormatted || 'Offline-first SQLite database and media'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text style={[type.statSm, { color: colors.accentText }]}>{storageFormatted}</Text>
                <ScalePressable
                  onPress={refreshStorage}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh storage usage"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.sm,
                    backgroundColor: colors.cardMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw size={16} color={colors.textMuted} />
                </ScalePressable>
              </View>
            </View>

            {/* Export Data */}
            <ScalePressable
              onPress={handleExportData}
              accessibilityRole="button"
              accessibilityLabel="Export all data as JSON"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                minHeight: 56,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  minHeight: 44,
                  minWidth: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={20} color={colors.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Export Data</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Download full database backup as JSON
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </ScalePressable>

            {/* Import Data */}
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                loadLocalBackups();
                setIsImportModalOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Import data from backup"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                minHeight: 56,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  minHeight: 44,
                  minWidth: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={20} color={colors.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text }]}>Import Data</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Restore sessions, climbs, and projects from JSON
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </ScalePressable>

            {/* Clear All Data */}
            <ScalePressable
              onPress={handleClearData}
              accessibilityRole="button"
              accessibilityLabel="Clear all session, climb, and project data"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingVertical: space.md,
                minHeight: 56,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  minHeight: 44,
                  minWidth: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.dangerSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color={colors.dangerText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.dangerText }]}>Clear All Data</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Permanently deletes all sessions, climbs, and projects
                </Text>
              </View>
            </ScalePressable>

            {__DEV__ && (
              <View style={{ marginTop: space.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md }}>
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
                              refreshStorage();
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

        {/* About & Privacy */}
        <View>
          <SectionHeader title="About Gripped" />
          <Card>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingVertical: space.sm,
                paddingBottom: space.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Image
                source={require('../assets/logo.png')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                }}
                resizeMode="cover"
                accessibilityLabel="Gripped Logo"
              />
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.text, fontSize: 17 }]}>Gripped</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Offline-first Bouldering Ledger
                </Text>
              </View>
            </View>
            <SettingsRow
              label="Version"
              sublabel={`${Constants.expoConfig?.version ?? '1.0.0'} (Build ${Constants.expoConfig?.ios?.buildNumber ?? '1'})`}
              right={<Text style={[type.body, { color: colors.accentText }]}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>}
            />
            <SettingsRow
              label="Architecture"
              sublabel="Offline-first SQLite local store • CRDT outbox"
              right={<Text style={[type.body, { color: colors.flashText }]}>100% Local</Text>}
            />
            <ScalePressable
              onPress={() => router.push('/privacy-policy' as any)}
              accessibilityRole="button"
              accessibilityLabel="Read Privacy Policy"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: space.md,
                minHeight: 48,
              }}
            >
              <View style={{ flex: 1, marginRight: space.md }}>
                <Text style={[type.heading, { color: colors.text }]}>Privacy Policy</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Zero cloud telemetry • Your data never leaves your device
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </ScalePressable>
          </Card>
        </View>
      </Reanimated.ScrollView>

      {/* Import Modal */}
      <Modal
        visible={isImportModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: space.lg,
              paddingHorizontal: space.lg,
              paddingBottom: Math.max(insets.bottom, 24),
              maxHeight: '88%',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
              <View>
                <Text style={[type.title, { color: colors.text }]}>Import Gripped Data</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Restore your climbing logs from a JSON backup
                </Text>
              </View>
              <ScalePressable
                onPress={() => setIsImportModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close import modal"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.cardMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} color={colors.text} />
              </ScalePressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Detected local backup files */}
              {detectedBackups.length > 0 && (
                <View style={{ marginBottom: space.lg }}>
                  <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>
                    DETECTED LOCAL BACKUPS
                  </Text>
                  {detectedBackups.map((fileName) => (
                    <ScalePressable
                      key={fileName}
                      onPress={() => handleImportLocalFile(fileName)}
                      accessibilityRole="button"
                      accessibilityLabel={`Restore backup ${fileName}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: space.md,
                        backgroundColor: colors.cardMuted,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        marginBottom: space.sm,
                        minHeight: 52,
                      }}
                    >
                      <View style={{ flex: 1, marginRight: space.sm }}>
                        <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>{fileName}</Text>
                        <Text style={[type.caption, { color: colors.accentText }]}>Tap to restore</Text>
                      </View>
                      <Upload size={18} color={colors.accent} />
                    </ScalePressable>
                  ))}
                </View>
              )}

              {/* Paste JSON directly */}
              <View style={{ marginBottom: space.lg }}>
                <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>
                  PASTE BACKUP JSON
                </Text>
                <TextInput
                  value={importJsonText}
                  onChangeText={setImportJsonText}
                  placeholder="Paste JSON string here..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  accessibilityLabel="Paste JSON backup content"
                  style={{
                    height: 140,
                    backgroundColor: colors.cardMuted,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: space.md,
                    color: colors.text,
                    fontSize: 13,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              <PrimaryButton
                label={isImporting ? 'IMPORTING...' : 'VALIDATE & IMPORT JSON'}
                loading={isImporting}
                disabled={!importJsonText.trim()}
                onPress={() => handleImportJson(importJsonText)}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
