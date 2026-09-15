import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { v4 as uuid } from 'uuid';
import {
  ArrowLeft,
  Check,
  Trash2,
} from 'lucide-react-native';
import type {
  RoutineWithBlocks,
  RoutineBlock,
  RoutineCategory,
} from '../../types';
import { GRADE_BY_LABEL } from '../../constants/grades';
import { GradeSheet } from '../../components/session/GradeSheet';
import { StyleTagPickerModal } from '../../components/routines/StyleTagPickerModal';
import { CustomRestModal } from '../../components/routines/CustomRestModal';
import { PlannedBoulderRow } from '../../components/routines/PlannedBoulderRow';
import { triggerHaptic } from '../../utils/haptics';
import {
  getRoutineById,
  insertRoutine,
  updateRoutine,
} from '../../db/routineQueries';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { FLOATING_CARD_STYLE, THEME_COLORS } from '../../constants/theme';

const CATEGORY_PILLS: { label: string; value: RoutineCategory }[] = [
  { label: 'Strength', value: 'Strength' },
  { label: 'Power End.', value: 'Power Endurance' },
  { label: 'Volume', value: 'Volume' },
  { label: 'Technique', value: 'Technique' },
  { label: 'Project', value: 'Projecting' },
  { label: 'Other', value: 'Other' },
];

const CYCLE_PRESETS = [45, 60, 90, 120, 180];

function formatCompactRest(sec: number): string {
  if (sec >= 60 && sec % 60 === 0) return `${sec / 60}m`;
  return `${sec}s`;
}

export default function RoutineEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isEditing = Boolean(id);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoutineCategory>('Strength');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);

  // Modals
  const [activeBoulderForGrade, setActiveBoulderForGrade] = useState<{
    blockId: string;
    boulderId: string;
    gradeRaw: string;
  } | null>(null);

  const [activeBoulderForTags, setActiveBoulderForTags] = useState<{
    blockId: string;
    boulderId: string;
    tags: string[];
  } | null>(null);

  const [activeBlockForCustomRest, setActiveBlockForCustomRest] = useState<{
    blockId: string;
    title: string;
    seconds: number;
  } | null>(null);

  // Load existing or initialize draft
  useEffect(() => {
    if (id) {
      const routine = getRoutineById(id);
      if (routine) {
        setTitle(routine.title);
        setDescription(routine.description);
        setCategory(routine.category);
        setEstimatedMinutes(String(routine.estimatedMinutes));
        setBlocks(routine.blocks);
        return;
      }
    }

    // Default template draft
    const initialBlockId = uuid();
    setBlocks([
      {
        id: initialBlockId,
        routineId: 'new',
        title: 'Block 1: Warm-Up & Base',
        defaultRestSeconds: 60,
        order: 0,
        boulders: [
          {
            id: uuid(),
            blockId: initialBlockId,
            gradeRaw: 'V2',
            normalizedDifficulty: 2,
            targetAttempts: 1,
            styleTags: ['Slab'],
            order: 0,
          },
          {
            id: uuid(),
            blockId: initialBlockId,
            gradeRaw: 'V3',
            normalizedDifficulty: 3,
            targetAttempts: 2,
            styleTags: ['Overhang'],
            order: 1,
          },
        ],
      },
    ]);
  }, [id]);

  // Block management
  const handleAddBlock = () => {
    const newBlockId = uuid();
    const newBlock: RoutineBlock = {
      id: newBlockId,
      routineId: id || 'new',
      title: `Block ${blocks.length + 1}: Targeted Work`,
      defaultRestSeconds: 90,
      order: blocks.length,
      boulders: [
        {
          id: uuid(),
          blockId: newBlockId,
          gradeRaw: 'V4',
          normalizedDifficulty: 4,
          targetAttempts: 3,
          styleTags: [],
          order: 0,
        },
      ],
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      Alert.alert('Cannot Delete', 'A routine must contain at least one block.');
      return;
    }
    const targetBlock = blocks.find((b) => b.id === blockId);
    Alert.alert(
      'Delete Workout Block?',
      `Are you sure you want to delete "${targetBlock?.title || 'this block'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('medium');
            setBlocks(blocks.filter((b) => b.id !== blockId));
          },
        },
      ]
    );
  };

  const handleUpdateBlockTitle = (blockId: string, title: string) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, title } : b)));
  };

  const handleUpdateBlockRest = (blockId: string, rest: number) => {
    setBlocks(
      blocks.map((b) => (b.id === blockId ? { ...b, defaultRestSeconds: rest } : b))
    );
  };

  const handleCycleBlockRest = (blockId: string, currentRest: number) => {
    triggerHaptic('selection');
    const currentIndex = CYCLE_PRESETS.indexOf(currentRest);
    const nextRest =
      currentIndex !== -1
        ? CYCLE_PRESETS[(currentIndex + 1) % CYCLE_PRESETS.length]
        : 60;
    handleUpdateBlockRest(blockId, nextRest);
  };

  // Boulder management
  const handleAddBoulder = (blockId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id !== blockId) return b;
        const lastBoulder = b.boulders[b.boulders.length - 1];
        const gradeRaw = lastBoulder?.gradeRaw || 'V3';
        const diff = GRADE_BY_LABEL[gradeRaw]?.difficulty ?? 3;

        return {
          ...b,
          boulders: [
            ...b.boulders,
            {
              id: uuid(),
              blockId,
              gradeRaw,
              normalizedDifficulty: diff,
              targetAttempts: 2,
              styleTags: [],
              order: b.boulders.length,
            },
          ],
        };
      })
    );
  };

  const handleDeleteBoulder = (blockId: string, boulderId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id !== blockId) return b;
        if (b.boulders.length <= 1) {
          Alert.alert('Cannot Delete', 'Each block must have at least one boulder.');
          return b;
        }
        return {
          ...b,
          boulders: b.boulders.filter((bo) => bo.id !== boulderId),
        };
      })
    );
  };

  const handleGradeSelect = (gradeRaw: string) => {
    if (!activeBoulderForGrade) return;
    const { blockId, boulderId } = activeBoulderForGrade;
    const diff = GRADE_BY_LABEL[gradeRaw]?.difficulty ?? 0;

    setBlocks(
      blocks.map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          boulders: b.boulders.map((bo) =>
            bo.id === boulderId
              ? { ...bo, gradeRaw, normalizedDifficulty: diff }
              : bo
          ),
        };
      })
    );
    setActiveBoulderForGrade(null);
  };

  const handleAttemptsChange = (
    blockId: string,
    boulderId: string,
    delta: number
  ) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          boulders: b.boulders.map((bo) => {
            if (bo.id !== boulderId) return bo;
            const next = Math.max(1, bo.targetAttempts + delta);
            return { ...bo, targetAttempts: next };
          }),
        };
      })
    );
  };

  const handleToggleTag = (tag: string) => {
    if (!activeBoulderForTags) return;
    const { blockId, boulderId, tags } = activeBoulderForTags;
    const hasTag = tags.includes(tag);
    const nextTags = hasTag ? tags.filter((t) => t !== tag) : [...tags, tag];

    setActiveBoulderForTags({ blockId, boulderId, tags: nextTags });

    setBlocks(
      blocks.map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          boulders: b.boulders.map((bo) =>
            bo.id === boulderId ? { ...bo, styleTags: nextTags } : bo
          ),
        };
      })
    );
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing Title', 'Please enter a title for your routine.');
      return;
    }

    const estMins = parseInt(estimatedMinutes, 10) || 60;
    const routineId = id || uuid();

    const routineData: RoutineWithBlocks = {
      id: routineId,
      title: trimmedTitle,
      description: description.trim(),
      category,
      isCustom: true,
      estimatedMinutes: estMins,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blocks: blocks.map((b, bIdx) => ({
        ...b,
        routineId,
        order: bIdx,
        boulders: b.boulders.map((bo, boIdx) => ({
          ...bo,
          blockId: b.id,
          order: boIdx,
        })),
      })),
    };

    try {
      if (isEditing) {
        updateRoutine(routineData);
      } else {
        insertRoutine(routineData);
      }
      router.back();
    } catch (e) {
      console.error('Failed to save routine:', e);
      Alert.alert('Error', 'Could not save routine.');
    }
  };

  return (
    <ScreenContainer withTopInset={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, paddingTop: insets.top }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: '#2C2C35',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: THEME_COLORS.cardSurface,
              borderColor: THEME_COLORS.cardBorder,
              borderTopColor: 'rgba(255, 255, 255, 0.14)',
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '700',
              letterSpacing: -0.3,
            }}
          >
            {isEditing ? 'Edit Routine' : 'New Routine'}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#8E7CFF',
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              shadowColor: '#8E7CFF',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 5,
              elevation: 3,
            }}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 160 }}
        >
          {/* ── Metadata Section ───────────────────────────────────── */}
          <View
            style={[
              FLOATING_CARD_STYLE,
              {
                backgroundColor: '#1E1E24',
                borderColor: '#2C2C35',
                borderWidth: 1,
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
              },
            ]}
          >
            {/* Title Input: Minimal borderless input: "Routine Name" (20pt Bold White, placeholderTextColor "#5A5A65") */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Routine Name"
              placeholderTextColor="#5A5A65"
              style={{
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 12,
                padding: 0,
              }}
            />

            {/* Category Strip (Horizontal Scroll / Compact Row) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2, marginBottom: 12 }}
            >
              {CATEGORY_PILLS.map((item) => {
                const isSelected = category === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => {
                      triggerHaptic('selection');
                      setCategory(item.value);
                    }}
                    activeOpacity={0.75}
                    style={{
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: isSelected ? 'rgba(142, 124, 255, 0.15)' : '#17171C',
                      borderColor: isSelected ? '#8E7CFF' : '#2C2C35',
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isSelected ? '#8E7CFF' : '#8A8A98',
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Duration & Description Row: Collapse into a clean inline metadata row: "Est. Duration: 60m" (#8A8A98, 12pt) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: '#2C2C35',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '500' }}>
                  Est. Duration:
                </Text>
                <TextInput
                  value={estimatedMinutes}
                  onChangeText={setEstimatedMinutes}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor="#5A5A65"
                  style={{
                    color: '#8A8A98',
                    fontSize: 12,
                    fontWeight: '600',
                    minWidth: 24,
                    padding: 0,
                    textAlign: 'center',
                  }}
                />
                <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '500' }}>
                  m
                </Text>
              </View>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Focus or notes..."
                placeholderTextColor="#5A5A65"
                style={{
                  color: '#8A8A98',
                  fontSize: 12,
                  fontWeight: '500',
                  textAlign: 'right',
                  flex: 1,
                  marginLeft: 16,
                  padding: 0,
                }}
                numberOfLines={1}
              />
            </View>
          </View>

          {/* ── Climbing Blocks Section Header ───────────────────────── */}
          <View
            style={{
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
              }}
              className="uppercase"
            >
              CLIMBING BLOCKS • {blocks.length} {blocks.length === 1 ? 'BLOCK' : 'BLOCKS'}
            </Text>
          </View>

          {blocks.map((block, bIdx) => (
            <View
              key={block.id}
              style={[
                FLOATING_CARD_STYLE,
                {
                  backgroundColor: '#1E1E24',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 16,
                },
              ]}
            >
              {/* Block Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 12,
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#2C2C35',
                }}
              >
                {/* Left: Editable block title */}
                <TextInput
                  value={block.title}
                  onChangeText={(text) => handleUpdateBlockTitle(block.id, text)}
                  placeholder={`Block ${bIdx + 1} Name`}
                  placeholderTextColor="#5A5A65"
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '700',
                    flex: 1,
                    marginRight: 8,
                    padding: 0,
                  }}
                />

                {/* Right: Compact Rest Pill + Delete Block Button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleCycleBlockRest(block.id, block.defaultRestSeconds)}
                    onLongPress={() => {
                      triggerHaptic('medium');
                      setActiveBlockForCustomRest({
                        blockId: block.id,
                        title: block.title,
                        seconds: block.defaultRestSeconds,
                      });
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={{
                      backgroundColor: '#17171C',
                      borderColor: '#2C2C35',
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '600' }}>
                      Rest: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{formatCompactRest(block.defaultRestSeconds)}</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteBlock(block.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} color="#FF5C5C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Boulders List using PlannedBoulderRow */}
              {block.boulders.map((boulder) => (
                <PlannedBoulderRow
                  key={boulder.id}
                  boulder={boulder}
                  onPressGrade={() =>
                    setActiveBoulderForGrade({
                      blockId: block.id,
                      boulderId: boulder.id,
                      gradeRaw: boulder.gradeRaw,
                    })
                  }
                  onPressStyle={() =>
                    setActiveBoulderForTags({
                      blockId: block.id,
                      boulderId: boulder.id,
                      tags: boulder.styleTags,
                    })
                  }
                  onAttemptsChange={(delta) => handleAttemptsChange(block.id, boulder.id, delta)}
                  onDelete={() => handleDeleteBoulder(block.id, boulder.id)}
                />
              ))}

              {/* Add Planned Boulder Button */}
              <TouchableOpacity
                onPress={() => handleAddBoulder(block.id)}
                activeOpacity={0.75}
                style={{
                  backgroundColor: '#17171C',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  height: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 4,
                }}
              >
                <Text style={{ color: '#8E7CFF', fontSize: 13, fontWeight: '600' }}>
                  + Add Boulder
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Block Button */}
          <View style={{ marginTop: 2, marginBottom: 32 }}>
            <TouchableOpacity
              onPress={handleAddBlock}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#1E1E24',
                borderColor: '#2C2C35',
                borderWidth: 1,
                borderRadius: 16,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                + Add Climbing Block
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Grade Picker Bottom Sheet ───────────────────────────── */}
        <GradeSheet
          visible={Boolean(activeBoulderForGrade)}
          selectedGrade={activeBoulderForGrade?.gradeRaw ?? 'V3'}
          onSelect={handleGradeSelect}
          onClose={() => setActiveBoulderForGrade(null)}
        />

        {/* ── Style Tag Picker Modal ──────────────────────────────── */}
        <StyleTagPickerModal
          visible={Boolean(activeBoulderForTags)}
          selectedTags={activeBoulderForTags?.tags ?? []}
          onToggleTag={handleToggleTag}
          onClose={() => setActiveBoulderForTags(null)}
        />

        {/* ── Custom Rest Interval Modal ──────────────────────────── */}
        <CustomRestModal
          visible={Boolean(activeBlockForCustomRest)}
          initialSeconds={activeBlockForCustomRest?.seconds ?? 90}
          blockTitle={activeBlockForCustomRest?.title}
          onSave={(sec) => {
            if (activeBlockForCustomRest) {
              handleUpdateBlockRest(activeBlockForCustomRest.blockId, sec);
            }
          }}
          onClose={() => setActiveBlockForCustomRest(null)}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
