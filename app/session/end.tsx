import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useActiveSession } from '../../db/hooks';
import { useTheme } from '../../theme/useTheme';
import { completeSessionWrapUp } from '../../db/queries';
import { useSessionStore } from '../../store/sessionStore';

export default function EndSessionScreen() {
  const router = useRouter();
  const session = useActiveSession();
  const { colors, type, space, radius } = useTheme();
  
  const [notes, setNotes] = useState(session?.notes || '');
  const [rpe, setRpe] = useState(session?.rpe?.toString() || '');
  const setActiveSessionId = useSessionStore(s => s.setActiveSessionId);

  const handleFinish = () => {
    if (session) {
      completeSessionWrapUp(
        session.id,
        Date.now(),
        session.title || 'Session',
        notes,
        session.gymName,
        parseInt(rpe, 10) || null,
        session.mediaUris || []
      );
    }
    setActiveSessionId(null);
    router.replace('/analytics');
  };

  if (!session) return null;

  return (
    <Screen title="Finish Session" subtitle="How did it go?">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, marginTop: space.xl, gap: space.xl }}>
        
        <View>
          <SectionHeader title="Effort (RPE 1-10)" />
          <TextInput
            value={rpe}
            onChangeText={setRpe}
            keyboardType="number-pad"
            placeholder="e.g. 8"
            placeholderTextColor={colors.textMuted}
            style={[{ backgroundColor: colors.cardMuted, padding: space.md, borderRadius: radius.md, color: colors.text }, type.body]}
          />
        </View>

        <View>
          <SectionHeader title="Session Notes" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="How did you feel? What did you work on?"
            placeholderTextColor={colors.textMuted}
            style={[{ backgroundColor: colors.cardMuted, padding: space.md, borderRadius: radius.md, color: colors.text, minHeight: 120, textAlignVertical: 'top' }, type.body]}
          />
        </View>

        <View style={{ gap: space.md, marginTop: space.xl }}>
          <PrimaryButton label="SAVE & FINISH" onPress={handleFinish} />
          <SecondaryButton label="CANCEL" onPress={() => router.back()} />
        </View>
        
      </KeyboardAvoidingView>
    </Screen>
  );
}
