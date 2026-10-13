import React, { useState } from 'react';
import { View, Text, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { Chip } from '../ui/Chip';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { ScalePressable } from '../ui/ScalePressable';
import { insertPastSession, type PastSessionClimbInput } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

const GRADES = Array.from({ length: 12 }, (_, i) => `V${i}`);
const OUTCOMES: { key: PastSessionClimbInput['outcome']; label: string }[] = [
  { key: 'flash', label: 'Flash' },
  { key: 'top', label: 'Top' },
  { key: 'attempt', label: 'Attempt' },
];
const DAY_OPTIONS = [0, 1, 2, 3, 7, 14];
const DAY_MS = 86400000;

const dayLabel = (d: number) => (d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`);

export function PastSessionModal({ visible, gyms, onClose }: { visible: boolean; gyms: string[]; onClose: () => void }) {
  const { colors, space, radius, type } = useTheme();
  const insets = useSafeAreaInsets();

  const [daysAgo, setDaysAgo] = useState(1);
  const [gym, setGym] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [grade, setGrade] = useState('V3');
  const [outcome, setOutcome] = useState<PastSessionClimbInput['outcome']>('top');
  const [climbs, setClimbs] = useState<PastSessionClimbInput[]>([]);

  const reset = () => {
    setDaysAgo(1);
    setGym('');
    setDuration('60');
    setNotes('');
    setClimbs([]);
  };

  const addClimb = () => {
    triggerHaptic('light');
    setClimbs((c) => [...c, { gradeRaw: grade, outcome, attempts: 1 }]);
  };

  const save = () => {
    const mins = parseInt(duration, 10);
    if (!gym.trim()) {
      Alert.alert('Gym required', 'Enter or pick a gym for this session.');
      return;
    }
    if (!Number.isFinite(mins) || mins <= 0 || mins > 1440) {
      Alert.alert('Invalid duration', 'Duration must be between 1 and 1440 minutes.');
      return;
    }
    const start = Date.now() - daysAgo * DAY_MS - mins * 60000;
    insertPastSession({
      startTime: start,
      endTime: start + mins * 60000,
      gymName: gym.trim(),
      notes: notes.trim(),
      climbs,
    });
    triggerHaptic('success');
    reset();
    onClose();
  };

  const input = {
    backgroundColor: colors.cardMuted,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    marginBottom: space.md,
  } as const;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <View
          style={{
            backgroundColor: colors.materialBase,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: space.xl,
            maxHeight: '90%',
            paddingBottom: Math.max(insets.bottom, space.xl),
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
            <Text style={[type.title, { color: colors.text, fontSize: 18, fontWeight: '700' }]}>Log Past Session</Text>
            <ScalePressable onPress={onClose} minTouchTarget accessibilityRole="button" accessibilityLabel="Close">
              <X size={20} color={colors.textMuted} />
            </ScalePressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>WHEN</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md }}>
              {DAY_OPTIONS.map((d) => (
                <Chip key={d} label={dayLabel(d)} active={daysAgo === d} onPress={() => setDaysAgo(d)} />
              ))}
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>GYM</Text>
            <TextInput value={gym} onChangeText={setGym} placeholder="Gym name" placeholderTextColor={colors.textMuted} style={[type.body, input]} />
            {gyms.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md }}>
                {gyms.slice(0, 6).map((g) => (
                  <Chip key={g} label={g} active={gym === g} onPress={() => setGym(g)} />
                ))}
              </View>
            )}

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>DURATION (MIN)</Text>
            <TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={[type.body, input]} />

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>CLIMBS ({climbs.length})</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.sm }}>
              {GRADES.map((g) => (
                <Chip key={g} label={g} active={grade === g} onPress={() => setGrade(g)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.xs, marginBottom: space.sm }}>
              {OUTCOMES.map((o) => (
                <Chip key={o.key} label={o.label} active={outcome === o.key} onPress={() => setOutcome(o.key)} />
              ))}
            </View>
            <SecondaryButton label={`+ Add ${grade} ${outcome}`} onPress={addClimb} />
            {climbs.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm }}>
                {climbs.map((c, i) => (
                  <Animated.View
                    key={`${i}-${c.gradeRaw}-${c.outcome}`}
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(120)}
                    layout={LinearTransition.duration(150)}
                  >
                    <Chip
                      label={`${c.gradeRaw} ${c.outcome} ✕`}
                      onPress={() => {
                        triggerHaptic('light');
                        setClimbs((list) => list.filter((_, idx) => idx !== i));
                      }}
                    />
                  </Animated.View>
                ))}
              </View>
            )}

            <Text style={[type.label, { color: colors.textMuted, marginTop: space.md, marginBottom: space.xs }]}>NOTES</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[type.body, input, { minHeight: 70 }]}
            />

            <PrimaryButton label="Save Session" onPress={save} style={{ marginBottom: space.sm }} />
            <SecondaryButton label="Cancel" variant="muted" onPress={onClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
