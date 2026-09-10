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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { v4 as uuid } from 'uuid';
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Timer,
  Tag,
  Minus,
  Layers,
} from 'lucide-react-native';
import type {
  RoutineWithBlocks,
  RoutineBlock,
  RoutineCategory,
} from '../../types';
import { GRADE_BY_LABEL } from '../../constants/grades';
import { GradeSheet } from '../../components/session/GradeSheet';
import { StyleTagPickerModal } from '../../components/routines/StyleTagPickerModal';
import {
  getRoutineById,
  insertRoutine,
  updateRoutine,
} from '../../db/routineQueries';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { FLOATING_CARD_STYLE } from '../../constants/theme';

const CATEGORIES: RoutineCategory[] = [
  'Strength',
  'Power Endurance',
  'Volume',
  'Technique',
  'Projecting',
  'Other',
];

const REST_PRESETS = [30, 45, 60, 90, 120, 180];

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
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleUpdateBlockTitle = (blockId: string, title: string) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, title } : b)));
  };

  const handleUpdateBlockRest = (blockId: string, rest: number) => {
    setBlocks(
      blocks.map((b) => (b.id === blockId ? { ...b, defaultRestSeconds: rest } : b))
    );
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
            borderColor: '#2A2A32',
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
              backgroundColor: '#1E1E24',
              borderColor: '#2A2A32',
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
          contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 80 }}
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
                marginHorizontal: 16,
                marginBottom: 20,
              },
            ]}
          >
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
                marginBottom: 6,
              }}
              className="uppercase"
            >
              Routine Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. 4x4 Power Endurance, Tuesday Projects"
              placeholderTextColor="#555562"
              style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '700',
                marginBottom: 14,
                paddingBottom: 6,
                borderBottomWidth: 1,
                borderBottomColor: '#2A2A32',
              }}
            />

            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
                marginBottom: 6,
              }}
              className="uppercase"
            >
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief explanation of session goals or strategy..."
              placeholderTextColor="#555562"
              multiline
              numberOfLines={2}
              style={{
                color: '#FFFFFF',
                fontSize: 13.5,
                lineHeight: 18,
                marginBottom: 14,
                paddingBottom: 6,
                borderBottomWidth: 1,
                borderBottomColor: '#2A2A32',
              }}
            />

            {/* Category Chips */}
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
              className="uppercase"
            >
              Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.75}
                    style={{
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: isSelected ? '#8E7CFF' : '#141418',
                      borderColor: isSelected ? '#8E7CFF' : '#2A2A32',
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isSelected ? '#FFFFFF' : '#9A9AA6',
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Estimated Duration */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: '#2A2A32',
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
                Estimated Duration (mins)
              </Text>
              <TextInput
                value={estimatedMinutes}
                onChangeText={setEstimatedMinutes}
                keyboardType="numeric"
                style={{
                  color: '#8E7CFF',
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'right',
                  width: 60,
                }}
              />
            </View>
          </View>

          {/* ── Climbing Blocks ────────────────────────────────────── */}
          <View
            style={{
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Layers size={16} color="#8E7CFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                Climbing Blocks
              </Text>
            </View>
            <Text style={{ color: '#8A8A98', fontSize: 12 }}>
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
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
                  marginHorizontal: 16,
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
                  paddingBottom: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#2A2A32',
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <TextInput
                    value={block.title}
                    onChangeText={(text) => handleUpdateBlockTitle(block.id, text)}
                    placeholder={`Block ${bIdx + 1} Name`}
                    placeholderTextColor="#555562"
                    style={{
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteBlock(block.id)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={16} color="#FF5C5C" />
                </TouchableOpacity>
              </View>

              {/* Rest Timer Selector */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  backgroundColor: '#16161B',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderColor: '#2A2A32',
                  borderWidth: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Timer size={13} color="#8E7CFF" />
                  <Text style={{ color: '#9A9AA6', fontSize: 12, fontWeight: '600' }}>
                    Target Rest:
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {REST_PRESETS.map((sec) => {
                    const isSelected = block.defaultRestSeconds === sec;
                    return (
                      <TouchableOpacity
                        key={sec}
                        onPress={() => handleUpdateBlockRest(block.id, sec)}
                        activeOpacity={0.7}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: isSelected
                            ? 'rgba(142, 124, 255, 0.2)'
                            : '#1E1E24',
                          borderColor: isSelected ? '#8E7CFF' : '#2A2A32',
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: isSelected ? '#8E7CFF' : '#8A8A98',
                          }}
                        >
                          {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Boulders List Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  paddingBottom: 4,
                  gap: 8,
                }}
              >
                <Text style={{ color: '#8A8A98', fontSize: 10, width: 20, textAlign: 'center' }}>#</Text>
                <Text style={{ color: '#8A8A98', fontSize: 10, width: 48, textAlign: 'center' }}>Grade</Text>
                <Text style={{ color: '#8A8A98', fontSize: 10, width: 72, textAlign: 'center' }}>Attempts</Text>
                <Text style={{ color: '#8A8A98', fontSize: 10, flex: 1, textAlign: 'right', paddingRight: 8 }}>
                  Styles / Tags
                </Text>
              </View>

              {/* Boulders Rows */}
              {block.boulders.map((boulder, boIdx) => {
                const gradeDef = GRADE_BY_LABEL[boulder.gradeRaw];
                return (
                  <View
                    key={boulder.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 4,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                      gap: 8,
                    }}
                  >
                    {/* Index */}
                    <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '700', width: 20, textAlign: 'center' }}>
                      {boIdx + 1}
                    </Text>

                    {/* Grade Pill Button */}
                    <TouchableOpacity
                      onPress={() =>
                        setActiveBoulderForGrade({
                          blockId: block.id,
                          boulderId: boulder.id,
                          gradeRaw: boulder.gradeRaw,
                        })
                      }
                      activeOpacity={0.75}
                      style={{
                        backgroundColor: gradeDef?.color ?? '#374151',
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        minWidth: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: gradeDef?.textColor ?? '#FFFFFF',
                          fontSize: 12,
                          fontWeight: '800',
                        }}
                      >
                        {boulder.gradeRaw}
                      </Text>
                    </TouchableOpacity>

                    {/* Attempts Stepper */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#141418',
                        borderRadius: 8,
                        borderColor: '#2A2A32',
                        borderWidth: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleAttemptsChange(block.id, boulder.id, -1)}
                        style={{ width: 24, height: 28, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={10} color="#9CA3AF" />
                      </TouchableOpacity>
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontWeight: '700',
                          fontSize: 12,
                          width: 24,
                          textAlign: 'center',
                        }}
                      >
                        {boulder.targetAttempts}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleAttemptsChange(block.id, boulder.id, 1)}
                        style={{ width: 24, height: 28, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={10} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    {/* Style Tags Trigger */}
                    <TouchableOpacity
                      onPress={() =>
                        setActiveBoulderForTags({
                          blockId: block.id,
                          boulderId: boulder.id,
                          tags: boulder.styleTags,
                        })
                      }
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      {boulder.styleTags.length === 0 ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: '#141418',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            borderColor: '#2A2A32',
                            borderWidth: 1,
                          }}
                        >
                          <Tag size={10} color="#8A8A98" />
                          <Text style={{ color: '#8A8A98', fontSize: 10, fontWeight: '600' }}>
                            + Style
                          </Text>
                        </View>
                      ) : (
                        boulder.styleTags.map((tag) => (
                          <View
                            key={tag}
                            style={{
                              backgroundColor: 'rgba(142, 124, 255, 0.15)',
                              borderColor: 'rgba(142, 124, 255, 0.3)',
                              borderWidth: 1,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ color: '#8E7CFF', fontSize: 9, fontWeight: '700' }}>
                              {tag}
                            </Text>
                          </View>
                        ))
                      )}
                    </TouchableOpacity>

                    {/* Delete Boulder */}
                    <TouchableOpacity
                      onPress={() => handleDeleteBoulder(block.id, boulder.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={14} color="#8A8A98" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Add Planned Boulder Button */}
              <TouchableOpacity
                onPress={() => handleAddBoulder(block.id)}
                activeOpacity={0.75}
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderStyle: 'dashed',
                  borderWidth: 1.2,
                  borderColor: '#2C2C35',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Plus size={13} color="#9A9AA6" />
                <Text style={{ color: '#9A9AA6', fontSize: 12, fontWeight: '700' }}>
                  Add Planned Boulder
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Block Button */}
          <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 32 }}>
            <TouchableOpacity
              onPress={handleAddBlock}
              activeOpacity={0.8}
              style={{
                paddingVertical: 14,
                borderRadius: 20,
                borderStyle: 'dashed',
                borderWidth: 1.2,
                borderColor: 'rgba(142, 124, 255, 0.45)',
                backgroundColor: 'rgba(142, 124, 255, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Plus size={16} color="#8E7CFF" />
              <Text style={{ color: '#8E7CFF', fontSize: 14, fontWeight: '700' }}>
                Add Climbing Block
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
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
