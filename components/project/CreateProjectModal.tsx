import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { Chip } from '../ui/Chip';
import { PrimaryButton } from '../ui/PrimaryButton';
import { useRecentGyms } from '../../db/hooks';
import { triggerHaptic } from '../../utils/haptics';
import * as Q from '../../db/queries';

const GRADES = ['VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15'];
const WALL_ANGLES = [
  { key: 'slab', label: 'Slab' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'overhang', label: 'Overhang' },
  { key: 'roof', label: 'Roof' }
];
const HOLD_TYPES = [
  { key: 'crimps', label: 'Crimps' },
  { key: 'slopers', label: 'Slopers' },
  { key: 'pinches', label: 'Pinches' },
  { key: 'pockets', label: 'Pockets' },
  { key: 'volumes', label: 'Volumes' }
];

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  defaultGym?: string;
  onCreated?: () => void;
}

export function CreateProjectModal({ visible, onClose, defaultGym, onCreated }: CreateProjectModalProps) {
  const { colors, space, radius, type } = useTheme();
  const insets = useSafeAreaInsets();
  const recentGyms = useRecentGyms();

  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newAngle, setNewAngle] = useState('overhang');
  const [newHoldType, setNewHoldType] = useState('crimps');
  const [newTotalMoves, setNewTotalMoves] = useState('');
  const [newBeta, setNewBeta] = useState('');
  const [newGym, setNewGym] = useState(defaultGym || '');
  const [newZone, setNewZone] = useState('');
  const [newSetDate, setNewSetDate] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  useEffect(() => {
    if (visible) {
      if (defaultGym) {
        setNewGym(defaultGym);
      } else if (!newGym) {
        setNewGym(Q.getLastUsedGym() || '');
      }
    }
  }, [visible, defaultGym]);

  const handleSave = () => {
    if (!newTitle.trim() || !newGrade || !newGym.trim()) return;

    triggerHaptic('medium');
    Q.createProject({
      title: newTitle.trim(),
      gradeRaw: newGrade,
      normalizedDifficulty: GRADES.indexOf(newGrade as any),
      wallAngle: newAngle as any,
      holdType: newHoldType as any,
      status: 'in_progress',
      highWaterMarkMoves: 0,
      totalMoves: parseInt(newTotalMoves) || undefined,
      microBeta: newBeta.trim() || undefined,
      gymName: newGym.trim() || undefined,
      zone: newZone.trim() || undefined,
      setDate: newSetDate.trim() || undefined,
    });

    // Reset fields
    setNewTitle('');
    setNewGrade('');
    setNewTotalMoves('');
    setNewBeta('');
    if (!defaultGym) setNewGym('');
    setNewZone('');
    setNewSetDate('');
    setShowMoreDetails(false);

    onClose();
    if (onCreated) {
      onCreated();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bgTexture }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingTop: Math.max(insets.top, 20) }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <Text style={[type.heading, { color: colors.text, fontSize: 20 }]}>New Project</Text>
                {defaultGym && (
                  <Text style={[type.caption, { color: colors.accent, marginTop: 2 }]}>at {defaultGym}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.md,
                  backgroundColor: colors.cardMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: 120 }}>


              {/* Project Name */}
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>PROJECT NAME</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Blue sloper on the prow"
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    backgroundColor: colors.cardMuted,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: space.md,
                    height: 52,
                    marginBottom: space.lg,
                    color: colors.text,
                  },
                ]}
              />

              {/* Target Grade */}
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>TARGET GRADE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.lg }}>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {GRADES.map(g => (
                    <Chip key={g} label={g} active={newGrade === g} onPress={() => { triggerHaptic('light'); setNewGrade(g); }} />
                  ))}
                </View>
              </ScrollView>

              {/* Wall Angle */}
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>WALL ANGLE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {WALL_ANGLES.map(a => (
                  <Chip key={a.key} label={a.label} active={newAngle === a.key} onPress={() => { triggerHaptic('light'); setNewAngle(a.key); }} />
                ))}
              </View>

              {/* Hold Type */}
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>HOLD TYPE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                {HOLD_TYPES.map(h => (
                  <Chip key={h.key} label={h.label} active={newHoldType === h.key} onPress={() => { triggerHaptic('light'); setNewHoldType(h.key); }} />
                ))}
              </View>

              {/* Estimated Total Moves */}
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>ESTIMATED TOTAL MOVES (OPTIONAL)</Text>
              <TextInput
                value={newTotalMoves}
                onChangeText={setNewTotalMoves}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    backgroundColor: colors.cardMuted,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: space.md,
                    height: 52,
                    marginBottom: space.lg,
                    color: colors.text,
                  },
                ]}
              />

              {/* Initial Notes */}
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>INITIAL NOTES (OPTIONAL)</Text>
              <TextInput
                value={newBeta}
                onChangeText={setNewBeta}
                multiline
                placeholder="Micro-beta, sequence..."
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    backgroundColor: colors.cardMuted,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: space.md,
                    marginBottom: space.md,
                    minHeight: 90,
                    color: colors.text,
                    textAlignVertical: 'top',
                  },
                ]}
              />

              {!showMoreDetails ? (
                <TouchableOpacity onPress={() => setShowMoreDetails(true)} style={{ marginBottom: space.xl, alignSelf: 'center', paddingVertical: space.xs }}>
                  <Text style={[type.body, { color: colors.accent, fontWeight: '600' }]}>+ Show more details (Zone, Set Date)</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginBottom: space.xl }}>
                  <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>ZONE / WALL (OPTIONAL)</Text>
                  <TextInput
                    value={newZone}
                    onChangeText={setNewZone}
                    placeholder="e.g. Competition Wall"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      type.body,
                      {
                        backgroundColor: colors.cardMuted,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: space.md,
                        height: 52,
                        marginBottom: space.lg,
                        color: colors.text,
                      },
                    ]}
                  />

                  <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>SET DATE (OPTIONAL)</Text>
                  <TextInput
                    value={newSetDate}
                    onChangeText={setNewSetDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      type.body,
                      {
                        backgroundColor: colors.cardMuted,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: space.md,
                        height: 52,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>
              )}

              <PrimaryButton 
                label="SAVE PROJECT" 
                onPress={handleSave} 
                disabled={!newTitle.trim() || !newGrade || !newGym.trim()} 
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
