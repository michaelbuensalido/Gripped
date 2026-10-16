import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Keyboard,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useRouter, Redirect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, AlertCircle } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { StatTile } from '../../components/ui/StatTile';
import { SessionInsights } from '../../components/session/SessionInsights';
import { ScalePressable } from '../../components/ui/ScalePressable';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession, useSessionClimbs } from '../../db/hooks';
import { completeSessionWrapUp, deleteSession } from '../../db/queries';
import { useSessionStore } from '../../store/sessionStore';
import { triggerHaptic } from '../../utils/haptics';

const EFFORT_LABELS = ['', 'Easy (Warm-up / Technique)', 'Moderate (Steady Volume)', 'Hard (Project Burns)', 'Very Hard (High Intensity)', 'Max Effort (Limit Sends)'];
const SKIN_STATES = ['Good', 'Thin', 'Split', 'Sweaty'];
const FINGER_STATES = ['Fresh', 'Tired', 'Sore', 'Tweaked'];

export default function EndSessionScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const session = useActiveSession();
  const setActiveSessionId = useSessionStore((s) => s.setActiveSessionId);
  const climbs = useSessionClimbs(session?.id || '');

  const [notes, setNotes] = useState('');
  const [effort, setEffort] = useState<number | null>(null);
  const [skinState, setSkinState] = useState<string | null>(null);
  const [fingerFatigue, setFingerFatigue] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const isSubmitting = useRef(false);

  if (!session) {
    return <Redirect href="/" />;
  }

  const durationMs = Math.max(0, Date.now() - session.startTime);
  const durationMin = Math.max(1, Math.round(durationMs / 60000));
  const durationLabel = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
    : `${durationMin}m`;

  const activeClimbs = climbs.filter((c) => c.deleted_at === null);
  const sends = activeClimbs.filter((c) => ['send', 'top', 'flash'].includes(c.result));
  const topGrade = sends.length > 0 
    ? [...sends].sort((a, b) => b.grade_index - a.grade_index)[0].grade_raw 
    : '–';

  const handlePickPhotos = async () => {
    try {
      triggerHaptic('light');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        const uris = result.assets.map((a) => a.uri);
        setPhotos((prev) => [...prev, ...uris]);
      }
    } catch (e) {
      console.warn('Error picking session photos', e);
    }
  };

  const handleRemovePhoto = (index: number) => {
    triggerHaptic('light');
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    try {
      Keyboard.dismiss();
      triggerHaptic('medium');

      useSessionStore.getState().setRestTimer(null, false);
      completeSessionWrapUp(
        session.id,
        Date.now(),
        session.title || 'Session',
        notes.trim(),
        session.gymName || '',
        effort ?? null,
        photos ?? [],
        skinState ?? null,
        fingerFatigue ?? null
      );
      setActiveSessionId(null);
      try {
        require('../../services/liveActivity').liveActivityManager.endSession();
      } catch {}
      router.replace('/session/summary');
    } catch (err) {
      console.error('Error completing session wrap up:', err);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Session',
      'Are you sure you want to discard this session? All logged climbs will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            triggerHaptic('heavy');
            useSessionStore.getState().setRestTimer(null, false);
            deleteSession(session.id);
            setActiveSessionId(null);
            try {
              require('../../services/liveActivity').liveActivityManager.endSession();
            } catch {}
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert('Go Back', 'Return to the active session?', [
      { text: 'Stay here', style: 'cancel' },
      { text: 'Go back', onPress: () => router.back() },
    ]);
  };

  return (
    <Screen title="Session Wrap-Up" subtitle="Great work today." scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, marginTop: space.lg }}
      >
        <Reanimated.ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: space.xl, paddingBottom: 140 }}
        >

          {/* Empty session warning banner if 0 climbs */}
          {activeClimbs.length === 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                backgroundColor: 'rgba(255, 77, 77, 0.12)',
                borderWidth: 1,
                borderColor: colors.danger,
                borderRadius: radius.md,
                padding: space.md,
              }}
            >
              <AlertCircle size={20} color={colors.dangerText} />
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { color: colors.dangerText, fontSize: 14 }]}>
                  Empty Session
                </Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  No climbs were recorded. You can still save notes or discard.
                </Text>
              </View>
            </View>
          )}

          {/* Session Overview Stats */}
          <View>
            <SectionHeader title="Session Overview" />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: space.sm }}>
              <StatTile label="CLIMBS" value={activeClimbs.length} flex />
              <StatTile label="HARDEST" value={topGrade} flex />
              <StatTile label="DURATION" value={durationLabel} flex />
            </View>
          </View>

          {/* Perceived Effort (1–5) */}
          <View>
            <SectionHeader title="Perceived Effort / RPE (1–5)" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = effort === n;
                return (
                  <ScalePressable
                    key={n}
                    onPress={() => { triggerHaptic('light'); setEffort(n); }}
                    haptic="light"
                    activeScale={0.94}
                    style={{
                      flex: 1,
                      height: 56,
                      borderRadius: radius.md,
                      backgroundColor: selected ? colors.accentSoft : colors.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={[type.heading, { color: selected ? colors.accent : colors.textWhiteMuted }]}>
                      {n}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
            {effort !== null && (
              <Text style={[type.caption, { color: colors.accentText, marginTop: space.sm }]}>
                {EFFORT_LABELS[effort]}
              </Text>
            )}
          </View>

          {/* Skin State */}
          <View>
            <SectionHeader title="Skin State" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {SKIN_STATES.map((state) => {
                const selected = skinState === state;
                return (
                  <ScalePressable
                    key={state}
                    onPress={() => {
                      triggerHaptic('light');
                      setSkinState(selected ? null : state);
                    }}
                    haptic="light"
                    activeScale={0.94}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: radius.pill,
                      backgroundColor: selected ? colors.accentSoft : colors.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={[type.heading, { color: selected ? colors.accent : colors.textMuted, fontSize: 13 }]}>
                      {state}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
          </View>

          {/* Finger State */}
          <View>
            <SectionHeader title="Finger State / Fatigue" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {FINGER_STATES.map((state) => {
                const selected = fingerFatigue === state;
                return (
                  <ScalePressable
                    key={state}
                    onPress={() => {
                      triggerHaptic('light');
                      setFingerFatigue(selected ? null : state);
                    }}
                    haptic="light"
                    activeScale={0.94}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: radius.pill,
                      backgroundColor: selected ? colors.accentSoft : colors.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={[type.heading, { color: selected ? colors.accent : colors.textMuted, fontSize: 13 }]}>
                      {state}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
          </View>

          {/* Session Photos */}
          <View>
            <SectionHeader title="Session Photos" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
              <ScalePressable
                onPress={handlePickPhotos}
                haptic="light"
                activeScale={0.94}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: radius.md,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Camera size={22} color={colors.accent} />
                <Text style={[type.caption, { color: colors.textMuted, fontSize: 10 }]}>Add Photo</Text>
              </ScalePressable>

              {photos.map((uri, idx) => (
                <View key={uri + idx} style={{ width: 76, height: 76, borderRadius: radius.md, overflow: 'hidden', position: 'relative' }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                  <TouchableOpacity
                    onPress={() => handleRemovePhoto(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Session notes */}
          <View>
            <SectionHeader title="Session Notes (optional)" />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              placeholder="How did you feel? What clicked today?"
              placeholderTextColor={colors.textWhiteMuted}
              style={[
                type.body,
                {
                  color: colors.textWhitePrimary,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: space.md,
                  minHeight: 100,
                  textAlignVertical: 'top',
                },
              ]}
            />
          </View>
          
          {/* Visual Insights */}
          {activeClimbs.length > 0 && (
            <View>
              <SectionHeader title="Performance Insights" />
              <SessionInsights climbs={climbs} />
            </View>
          )}

        </Reanimated.ScrollView>

        <View style={{ gap: space.md, paddingBottom: space.xl, backgroundColor: 'transparent' }}>
          <PrimaryButton testID="finish-session-btn" label="SAVE & FINISH" onPress={handleFinish} />
          <SecondaryButton label="Back to Session" onPress={handleCancel} />
          <TouchableOpacity 
            onPress={handleDiscard}
            style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: space.xs }}
            accessibilityRole="button"
            accessibilityLabel="Discard Session"
          >
            <Text style={[type.heading, { color: colors.danger }]}>Discard Session</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
