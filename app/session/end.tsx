import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useRouter, Redirect } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { StatTile } from '../../components/ui/StatTile';
import { SessionInsights } from '../../components/session/SessionInsights';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession, useSessionClimbs } from '../../db/hooks';
import { completeSessionWrapUp, deleteSession } from '../../db/queries';
import { useSessionStore } from '../../store/sessionStore';
import { triggerHaptic } from '../../utils/haptics';

const EFFORT_LABELS = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort'];

export default function EndSessionScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const session = useActiveSession();
  const setActiveSessionId = useSessionStore((s) => s.setActiveSessionId);
  const climbs = useSessionClimbs(session?.id || '');

  const [notes, setNotes] = useState('');
  const [effort, setEffort] = useState<number | null>(null);

  if (!session) {
    return <Redirect href="/" />;
  }

  const durationMs = Date.now() - session.startTime;
  const durationMin = Math.max(1, Math.round(durationMs / 60000));
  
  // Calculate top grade
  const sends = climbs.filter(c => c.deleted_at === null && ['send', 'top', 'flash'].includes(c.result));
  const topGrade = sends.length > 0 
    ? [...sends].sort((a, b) => b.grade_index - a.grade_index)[0].grade_raw 
    : '–';

  const handleFinish = () => {
    triggerHaptic('medium');
    completeSessionWrapUp(
      session.id,
      Date.now(),
      session.title || 'Session',
      notes,
      session.gymName,
      effort,
      session.mediaUris ?? []
    );
    setActiveSessionId(null);
    router.replace('/session/summary');
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
            deleteSession(session.id);
            setActiveSessionId(null);
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
        <Reanimated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.xl, paddingBottom: 140 }}>

          {/* Session Overview Stats */}
          <View>
            <SectionHeader title="Session Overview" />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: space.sm }}>
              <StatTile label="CLIMBS" value={climbs.filter(c => !c.deleted_at).length} flex />
              <StatTile label="HARDEST" value={topGrade} flex />
              <StatTile label="DURATION" value={`${durationMin}m`} flex />
            </View>
          </View>

          {/* Effort selector */}
          <View>
            <SectionHeader title="Perceived Effort (1–5)" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = effort === n;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => { triggerHaptic('light'); setEffort(n); }}
                    style={{
                      flex: 1,
                      height: 56,
                      borderRadius: radius.md,
                      backgroundColor: selected ? 'rgba(168,114,255,0.15)' : colors.materialBase,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 0,
                    }}
                  >
                    <Text style={[type.heading, { color: selected ? colors.accent : colors.textWhiteMuted }]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {effort !== null && (
              <Text style={[type.caption, { color: colors.textWhiteMuted, marginTop: space.sm }]}>
                {EFFORT_LABELS[effort]}
              </Text>
            )}
          </View>

          {/* Session notes */}
          <View>
            <SectionHeader title="Session Notes (optional)" />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="How did you feel? What clicked today?"
              placeholderTextColor={colors.textWhiteMuted}
              style={[
                type.body,
                {
                  color: colors.textWhitePrimary,
                  backgroundColor: colors.materialBase,
                  borderRadius: radius.md,
                  borderWidth: 0,
                  padding: space.md,
                  minHeight: 100,
                  textAlignVertical: 'top',
                },
              ]}
            />
          </View>
          
          {/* Visual Insights */}
          <View>
            <SectionHeader title="Performance Insights" />
            <SessionInsights climbs={climbs} />
          </View>

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
