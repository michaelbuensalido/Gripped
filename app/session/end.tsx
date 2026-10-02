import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession } from '../../db/hooks';
import { completeSessionWrapUp, deleteSession } from '../../db/queries';
import { useSessionStore } from '../../store/sessionStore';
import { triggerHaptic } from '../../utils/haptics';

const EFFORT_LABELS = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort'];

export default function EndSessionScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const session = useActiveSession();
  const setActiveSessionId = useSessionStore((s) => s.setActiveSessionId);

  const [notes, setNotes] = useState('');
  const [effort, setEffort] = useState<number | null>(null);

  if (!session) {
    return <Redirect href="/" />;
  }

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
    <Screen title="End Session" subtitle="How did it go?" scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, marginTop: space.lg }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.xl, paddingBottom: 140 }}>

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
                      backgroundColor: selected ? colors.accentSoft : colors.cardMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selected ? 1.5 : 0,
                      borderColor: selected ? colors.accent : 'transparent',
                    }}
                  >
                    <Text style={[type.heading, { color: selected ? colors.accentText : colors.text }]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {effort !== null && (
              <Text style={[type.caption, { color: colors.textMuted, marginTop: space.sm }]}>
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
              placeholderTextColor={colors.textMuted}
              style={[
                type.body,
                {
                  color: colors.text,
                  backgroundColor: colors.cardMuted,
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
        </ScrollView>

        <View style={{ gap: space.md, paddingBottom: space.xl }}>
          <PrimaryButton testID="finish-session-btn" label="SAVE & FINISH" onPress={handleFinish} />
                    <SecondaryButton label="Back to Session" onPress={handleCancel} />
          <TouchableOpacity 
            onPress={handleDiscard}
            style={{ paddingVertical: space.md, alignItems: 'center', marginTop: space.sm }}
          >
            <Text style={[type.heading, { color: colors.danger }]}>Discard Session</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
