import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import type { RoutineWithBlocks, RoutineCategory } from '../../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Helper to mock uuids quickly for static data
const mId = (prefix: string, idx: number) => `${prefix}_${idx}`;

const MOCK_TEMPLATES: RoutineWithBlocks[] = [
  {
    id: 'strict_pyramid',
    title: 'The Strict Pyramid',
    category: 'Endurance' as RoutineCategory,
    isCustom: false,
    estimatedMinutes: 60,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: '4x (Max-4), 3x (Max-3), 2x (Max-2), 1x (Max-1)',
    blocks: [
      {
        id: mId('sp_b', 1), routineId: 'strict_pyramid', title: 'Warm-Up (Max-4)', defaultRestSeconds: 60, order: 0,
        boulders: [
          { id: mId('sp_bo', 1), blockId: mId('sp_b', 1), gradeRaw: 'V-4', normalizedDifficulty: 0, targetAttempts: 4, styleTags: [], order: 0 }
        ]
      },
      {
        id: mId('sp_b', 2), routineId: 'strict_pyramid', title: 'Build (Max-3)', defaultRestSeconds: 90, order: 1,
        boulders: [
          { id: mId('sp_bo', 2), blockId: mId('sp_b', 2), gradeRaw: 'V-3', normalizedDifficulty: 1, targetAttempts: 3, styleTags: [], order: 0 }
        ]
      },
      {
        id: mId('sp_b', 3), routineId: 'strict_pyramid', title: 'Push (Max-2)', defaultRestSeconds: 120, order: 2,
        boulders: [
          { id: mId('sp_bo', 3), blockId: mId('sp_b', 3), gradeRaw: 'V-2', normalizedDifficulty: 2, targetAttempts: 2, styleTags: [], order: 0 }
        ]
      },
      {
        id: mId('sp_b', 4), routineId: 'strict_pyramid', title: 'Peak (Max-1)', defaultRestSeconds: 180, order: 3,
        boulders: [
          { id: mId('sp_bo', 4), blockId: mId('sp_b', 4), gradeRaw: 'V-1', normalizedDifficulty: 3, targetAttempts: 1, styleTags: [], order: 0 }
        ]
      }
    ]
  },
  {
    id: '4x4_circuit',
    title: 'The 4x4 Circuit',
    category: 'Power Endurance' as RoutineCategory,
    isCustom: false,
    estimatedMinutes: 45,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: '4 moderate routes back-to-back. Rest 3m. Repeat 4x.',
    blocks: [
      {
        id: mId('4x4_b', 1), routineId: '4x4_circuit', title: 'Circuit Block', defaultRestSeconds: 180, order: 0,
        boulders: [
          { id: mId('4x4_bo', 1), blockId: mId('4x4_b', 1), gradeRaw: 'Moderate', normalizedDifficulty: 3, targetAttempts: 4, styleTags: ['Endurance'], order: 0 },
          { id: mId('4x4_bo', 2), blockId: mId('4x4_b', 1), gradeRaw: 'Moderate', normalizedDifficulty: 3, targetAttempts: 4, styleTags: ['Endurance'], order: 1 },
          { id: mId('4x4_bo', 3), blockId: mId('4x4_b', 1), gradeRaw: 'Moderate', normalizedDifficulty: 3, targetAttempts: 4, styleTags: ['Endurance'], order: 2 },
          { id: mId('4x4_bo', 4), blockId: mId('4x4_b', 1), gradeRaw: 'Moderate', normalizedDifficulty: 3, targetAttempts: 4, styleTags: ['Endurance'], order: 3 },
        ]
      }
    ]
  },
  {
    id: 'volume_block',
    title: 'Volume Block',
    category: 'Endurance' as RoutineCategory,
    isCustom: false,
    estimatedMinutes: 90,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: '10 to 15 climbs exactly 2 grades below maximum.',
    blocks: [
      {
        id: mId('vb_b', 1), routineId: 'volume_block', title: 'Mileage', defaultRestSeconds: 90, order: 0,
        boulders: [
          { id: mId('vb_bo', 1), blockId: mId('vb_b', 1), gradeRaw: 'V-2', normalizedDifficulty: 2, targetAttempts: 12, styleTags: ['Mileage'], order: 0 }
        ]
      }
    ]
  },
  {
    id: 'disciplined_projecting',
    title: 'Disciplined Projecting',
    category: 'Projecting' as RoutineCategory,
    isCustom: false,
    estimatedMinutes: 120,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: '3 Warm-ups, max 5 burns on a limit project, 2 cool-downs.',
    blocks: [
      {
        id: mId('dp_b', 1), routineId: 'disciplined_projecting', title: 'Warm-up', defaultRestSeconds: 60, order: 0,
        boulders: [
          { id: mId('dp_bo', 1), blockId: mId('dp_b', 1), gradeRaw: 'V-Easy', normalizedDifficulty: 1, targetAttempts: 3, styleTags: ['Warmup'], order: 0 }
        ]
      },
      {
        id: mId('dp_b', 2), routineId: 'disciplined_projecting', title: 'Limit Project', defaultRestSeconds: 240, order: 1,
        boulders: [
          { id: mId('dp_bo', 2), blockId: mId('dp_b', 2), gradeRaw: 'V-Max', normalizedDifficulty: 7, targetAttempts: 5, styleTags: ['Project'], order: 0 }
        ]
      },
      {
        id: mId('dp_b', 3), routineId: 'disciplined_projecting', title: 'Cool-down', defaultRestSeconds: 60, order: 2,
        boulders: [
          { id: mId('dp_bo', 3), blockId: mId('dp_b', 3), gradeRaw: 'V-Easy', normalizedDifficulty: 1, targetAttempts: 2, styleTags: ['Cooldown'], order: 0 }
        ]
      }
    ]
  },
];

const TARGETS = ['Warm-Up', 'Power Endurance', 'Mileage', 'Limit Strength'];

interface RouteTemplateListProps {
  onStart: (routine: RoutineWithBlocks) => void;
}

export function RouteTemplateList({ onStart }: RouteTemplateListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <View>
      {MOCK_TEMPLATES.map((template, idx) => {
        const isExpanded = expandedId === template.id;
        const targetLabel = TARGETS[idx];

        return (
          <TouchableOpacity
            key={template.id}
            activeOpacity={0.8}
            onPress={() => toggleExpand(template.id)}
            className="bg-[#19191D] border border-[#27272F] rounded-xl p-4 mb-3"
          >
            <View className="flex-row justify-between items-center">
              {/* Left Column (Text) */}
              <View className="flex-1 pr-4">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-sm">{template.title}</Text>
                  {isExpanded ? <ChevronUp size={16} color="#555562" /> : <ChevronDown size={16} color="#555562" />}
                </View>
                <View className="bg-[#27272F]/50 border border-[#3A3A46] rounded mt-1 self-start px-2 py-0.5">
                  <Text className="text-[#8A8A98] text-[10px] uppercase tracking-wider">
                    {targetLabel}
                  </Text>
                </View>
                <Text className="text-[#8A8A98] text-xs leading-5 mt-2">
                  {template.description}
                </Text>
              </View>

              {/* Right Column (Action) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('medium');
                  onStart(template);
                }}
                className="bg-[#8E7CFF]/10 border border-[#8E7CFF]/30 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-[#8E7CFF] font-bold text-[10px] uppercase">
                  START
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expanded Content */}
            {isExpanded && (
              <View className="mt-4 pt-4 border-t border-[#27272F]">
                {template.blocks.map((block, bIdx) => {
                  const totalBurns = block.boulders.reduce((acc, b) => acc + b.targetAttempts, 0);
                  const grades = Array.from(new Set(block.boulders.map(b => b.gradeRaw))).join(', ');
                  return (
                    <View key={block.id} className="mb-3 last:mb-0">
                      <Text className="text-white text-xs font-bold mb-1">
                        Block {bIdx + 1}: {block.title}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <Text className="text-[#8A8A98] text-[11px]">
                          {totalBurns} burns • {grades}
                        </Text>
                        <View className="bg-[#27272F] px-1.5 py-0.5 rounded">
                          <Text className="text-[#8A8A98] text-[10px]">{block.defaultRestSeconds}s rest</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
