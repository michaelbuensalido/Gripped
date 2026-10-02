import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { Plus, X, Minus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { PrimaryButton } from '../ui/PrimaryButton';
import { ResultType } from '../ui/ResultChip';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';

const GRADES = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16'];

function GradePicker({ value, onChange }: { value: string; onChange: (g: string) => void }) {
  const { colors, type, space, radius } = useTheme();
  const idx = GRADES.indexOf(value);

  const prev = () => {
    if (idx > 0) { triggerHaptic('light'); onChange(GRADES[idx - 1]); }
  };
  const next = () => {
    if (idx < GRADES.length - 1) { triggerHaptic('light'); onChange(GRADES[idx + 1]); }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <TouchableOpacity onPress={prev} disabled={idx === 0} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardMuted, alignItems: 'center', justifyContent: 'center', opacity: idx === 0 ? 0.3 : 1 }}>
        <ChevronLeft size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingVertical: space.md }}>
        <Text style={[type.stat, { color: colors.accentText }]}>{value}</Text>
      </View>
      <TouchableOpacity onPress={next} disabled={idx === GRADES.length - 1} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardMuted, alignItems: 'center', justifyContent: 'center', opacity: idx === GRADES.length - 1 ? 0.3 : 1 }}>
        <ChevronRight size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

function ResultSelector({ value, onChange }: { value: ResultType; onChange: (r: ResultType) => void }) {
  const { colors, space, radius, type } = useTheme();
  const options: { result: ResultType; label: string; color: string; bg: string; testID?: string }[] = [
    { result: 'flash', label: 'Flash', color: colors.flashText, bg: colors.flashSoft },
    { result: 'top',   label: 'Top',   color: colors.topText,   bg: colors.topSoft },
    { result: 'attempt', label: 'Attempt', color: colors.attemptText, bg: colors.attemptSoft, testID: 'log-attempt-chip' },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      {options.map((o) => {
        const selected = value === o.result;
        return (
          <TouchableOpacity
            testID={o.testID}
            key={o.result}
            onPress={() => { triggerHaptic('light'); onChange(o.result); }}
            style={{ flex: 1, paddingVertical: space.lg, borderRadius: radius.md, backgroundColor: selected ? o.bg : colors.cardMuted, alignItems: 'center', justifyContent: 'center', borderWidth: selected ? 1.5 : 0, borderColor: selected ? o.color : 'transparent' }}
          >
            <Text style={[type.heading, { color: selected ? o.color : colors.textMuted }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AttemptsStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { colors, space, radius, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <TouchableOpacity onPress={() => { if (value > 1) { triggerHaptic('light'); onChange(value - 1); } }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardMuted, alignItems: 'center', justifyContent: 'center', opacity: value <= 1 ? 0.3 : 1 }}>
        <Minus size={18} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[type.stat, { color: colors.text }]}>{value}</Text>
      </View>
      <TouchableOpacity onPress={() => { triggerHaptic('light'); onChange(value + 1); }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

export function LogSheet({
  visible,
  onClose,
  onSave,
  initialGrade,
  initialResult,
  initialAttempts,
  initialNotes,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (grade: string, result: ResultType, attempts: number, notes: string) => void;
  initialGrade?: string;
  initialResult?: ResultType;
  initialAttempts?: number;
  initialNotes?: string;
}) {
  const { colors, space, type, radius, shadow } = useTheme();
  const [grade, setGrade] = useState(initialGrade ?? 'V4');
  const [result, setResult] = useState<ResultType>(initialResult ?? 'top');
  const [attempts, setAttempts] = useState(initialAttempts ?? 1);
  const [notes, setNotes] = useState(initialNotes ?? '');

  useEffect(() => {
    if (visible) {
      setGrade(initialGrade ?? 'V4');
      setResult(initialResult ?? 'top');
      setAttempts(initialAttempts ?? 1);
      setNotes(initialNotes ?? '');
    }
  }, [visible, initialGrade, initialResult, initialAttempts, initialNotes]);

  useEffect(() => {
    if (result === 'flash') setAttempts(1);
  }, [result]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, paddingBottom: space.xxl + 20, ...shadow.floating }}>
            
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space.lg }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
              <Text style={[type.title, { color: colors.text }]}>Log Climb</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <SectionHeader title="Result" />
            <View style={{ marginBottom: space.lg }}>
              <ResultSelector value={result} onChange={setResult} />
            </View>

            <SectionHeader title="Grade" />
            <View style={{ marginBottom: space.lg }}>
              <GradePicker value={grade} onChange={setGrade} />
            </View>

            {result !== 'flash' && (
              <>
                <SectionHeader title="Attempts" />
                <View style={{ marginBottom: space.lg }}>
                  <AttemptsStepper value={attempts} onChange={setAttempts} />
                </View>
              </>
            )}

            <SectionHeader title="Notes (optional)" />
            <TextInput
              value={notes} onChangeText={setNotes} placeholder="Beta, holds, feeling…" placeholderTextColor={colors.textMuted}
              multiline numberOfLines={2}
              style={[type.body, { color: colors.text, backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.md, marginBottom: space.xl, minHeight: 64, textAlignVertical: 'top' }]}
            />
            <PrimaryButton testID="save-climb-btn" label="SAVE CLIMB" onPress={() => onSave(grade, result, result === 'flash' ? 1 : attempts, notes)} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
