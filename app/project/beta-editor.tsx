import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, GripVertical, Plus, Trash2, CheckCircle2 } from 'lucide-react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useTheme } from '../../theme/useTheme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import * as B from '../../db/betaQueries';
import { Limb, LIMBS } from '../../types/beta';
import { triggerHaptic } from '../../utils/haptics';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

interface DraftMove {
  id: string;
  text: string;
  limb: Limb | null;
}

export default function BetaEditorScreen() {
  const { projectId, betaId } = useLocalSearchParams<{ projectId: string; betaId?: string }>();
  const router = useRouter();
  const { colors, space, radius, type } = useTheme();
  const insets = useSafeAreaInsets();

  const [label, setLabel] = useState('');
  const [keyTip, setKeyTip] = useState('');
  const [moves, setMoves] = useState<DraftMove[]>([]);
  const [cruxMoveId, setCruxMoveId] = useState<string | null>(null);

  useEffect(() => {
    if (betaId) {
      const beta = B.getBeta(betaId);
      if (beta) {
        setLabel(beta.label || '');
        setKeyTip(beta.keyTip || '');
        setCruxMoveId(beta.cruxMoveId);
        const existingMoves = B.getMovesForBeta(betaId);
        setMoves(existingMoves.map(m => ({ id: m.id, text: m.text, limb: m.limb })));
      }
    } else {
      // Initialize with one empty move
      setMoves([{ id: uuid(), text: '', limb: null }]);
    }
  }, [betaId]);

  const handleSave = () => {
    // Filter out completely empty moves
    const finalMoves = moves.filter(m => m.text.trim().length > 0 || m.limb !== null);

    if (finalMoves.length === 0 && !keyTip.trim()) {
      triggerHaptic('warning');
      Alert.alert('Empty Beta', 'Add at least one move or key tip before saving.');
      return;
    }
    
    // If the crux move was deleted or filtered out, clear it
    const finalCrux = finalMoves.some(m => m.id === cruxMoveId) ? cruxMoveId : null;

    const draft = {
      label: label.trim(),
      keyTip: keyTip.trim() || null,
      moves: finalMoves,
      cruxMoveId: finalCrux,
    };

    if (betaId) {
      B.updateBeta(betaId, draft);
    } else {
      B.createBeta(projectId!, draft, true); // make it current by default
    }
    triggerHaptic('success');
    router.back();
  };

  const addMove = () => {
    triggerHaptic('light');
    setMoves([...moves, { id: uuid(), text: '', limb: null }]);
  };

  const updateMove = (id: string, text: string) => {
    setMoves(moves.map(m => (m.id === id ? { ...m, text } : m)));
  };

  const toggleLimb = (id: string, limb: Limb) => {
    triggerHaptic('selection');
    setMoves(moves.map(m => {
      if (m.id !== id) return m;
      return { ...m, limb: m.limb === limb ? null : limb };
    }));
  };

  const toggleCrux = (id: string) => {
    triggerHaptic('selection');
    setCruxMoveId(cruxMoveId === id ? null : id);
  };

  const deleteMove = (id: string) => {
    triggerHaptic('medium');
    setMoves(moves.filter(m => m.id !== id));
    if (cruxMoveId === id) setCruxMoveId(null);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<DraftMove>) => {
    const isCrux = cruxMoveId === item.id;
    const index = getIndex();

    return (
      <ScaleDecorator>
        <View 
          style={{ 
            backgroundColor: isActive ? colors.cardMuted : colors.card,
            borderRadius: radius.md,
            padding: space.sm,
            marginBottom: space.sm,
            borderWidth: 1,
            borderColor: isCrux ? 'rgba(255, 69, 58, 0.4)' : colors.border,
            flexDirection: 'row',
            gap: space.sm,
            shadowColor: '#000',
            shadowOpacity: isActive ? 0.2 : 0,
            shadowRadius: 10,
            elevation: isActive ? 5 : 0,
          }}
        >
          <TouchableOpacity 
            onLongPress={drag} 
            delayLongPress={150}
            style={{ justifyContent: 'center', padding: 4 }}
          >
            <GripVertical size={20} color={colors.textMuted} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[type.caption, { color: colors.textMuted }]}>{index !== undefined ? index + 1 : '-'}</Text>
              </View>
              <TextInput
                value={item.text}
                onChangeText={(t) => updateMove(item.id, t)}
                placeholder="Move description..."
                placeholderTextColor={colors.textMuted}
                style={[type.body, { color: colors.text, flex: 1, padding: 0 }]}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <TouchableOpacity onPress={() => deleteMove(item.id)} style={{ padding: 4 }}>
                <Trash2 size={16} color={colors.dangerText} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {LIMBS.map(l => (
                  <TouchableOpacity
                    key={l}
                    onPress={() => toggleLimb(item.id, l)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: radius.sm,
                      backgroundColor: item.limb === l ? colors.accent : colors.bg,
                      borderWidth: 1,
                      borderColor: item.limb === l ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={[type.caption, { color: item.limb === l ? colors.textOnAccent : colors.textMuted, fontSize: 10 }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => toggleCrux(item.id)}
                accessibilityRole="button"
                accessibilityLabel={isCrux ? `Remove crux marker from move ${(index ?? 0) + 1}` : `Mark move ${(index ?? 0) + 1} as crux`}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderRadius: radius.sm,
                  backgroundColor: isCrux ? 'rgba(255, 69, 58, 0.15)' : 'transparent',
                }}
              >
                <CheckCircle2 size={14} color={isCrux ? '#FF453A' : colors.textMuted} />
                <Text style={[type.caption, { color: isCrux ? '#FF453A' : colors.textMuted, fontWeight: '600', fontSize: 10 }]}>CRUX</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  const handleDeleteVersion = () => {
    if (!betaId) return;
    Alert.alert(
      'Delete Beta Version',
      'Are you sure you want to delete this beta version and all its moves? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('medium');
            B.deleteBeta(betaId);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: space.lg, paddingBottom: space.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Back to project"
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[type.heading, { color: colors.text, fontSize: 16 }]}>{betaId ? 'Edit Beta' : 'New Beta'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.accent, borderRadius: radius.pill, minHeight: 44, justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Save beta version"
        >
          <Text style={[type.control, { color: colors.textOnAccent, fontWeight: '700' }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <DraggableFlatList
        data={moves}
        onDragEnd={({ data }) => setMoves(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.xl, gap: space.md }}>
            <View>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>VERSION LABEL (OPTIONAL)</Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Left heel hook method"
                placeholderTextColor={colors.textMuted}
                style={[type.body, { color: colors.text, backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}
              />
            </View>
            <View>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>KEY TIP</Text>
              <TextInput
                value={keyTip}
                onChangeText={setKeyTip}
                placeholder="The single most important thing..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={[type.body, { color: colors.text, backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, minHeight: 80 }]}
              />
            </View>
            <Text style={[type.label, { color: colors.textMuted, marginTop: space.sm }]}>MOVES (DRAG TO REORDER)</Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ gap: space.sm }}>
            <TouchableOpacity 
              onPress={addMove}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: space.md,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
                borderRadius: radius.md,
                marginTop: space.sm,
                minHeight: 48,
              }}
              accessibilityRole="button"
              accessibilityLabel="Add move"
            >
              <Plus size={20} color={colors.textMuted} />
              <Text style={[type.heading, { color: colors.textMuted }]}>Add Move</Text>
            </TouchableOpacity>

            {betaId && (
              <TouchableOpacity
                onPress={handleDeleteVersion}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: space.md,
                  backgroundColor: 'rgba(255, 69, 58, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 69, 58, 0.3)',
                  borderRadius: radius.md,
                  marginTop: space.sm,
                  minHeight: 48,
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete this beta version"
              >
                <Trash2 size={18} color={colors.dangerText} />
                <Text style={[type.heading, { color: colors.dangerText, fontSize: 14 }]}>Delete Version</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}
