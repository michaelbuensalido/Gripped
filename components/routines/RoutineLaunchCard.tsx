import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, Platform } from 'react-native';
import { MoreVertical, Edit3, Copy, Trash2 } from 'lucide-react-native';
import type { RoutineWithBlocks } from '../../types';
import { GRADE_BY_LABEL } from '../../constants/grades';
import { triggerHaptic } from '../../utils/haptics';

interface RoutineLaunchCardProps {
  routine: RoutineWithBlocks;
  onStart: (routine: RoutineWithBlocks) => void;
  onEdit: (routine: RoutineWithBlocks) => void;
  onDuplicate: (routineId: string) => void;
  onDelete: (routineId: string) => void;
}

export function RoutineLaunchCard({
  routine,
  onStart,
  onEdit,
  onDuplicate,
  onDelete,
}: RoutineLaunchCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  // Grade span
  const gradeList = routine.blocks
    .flatMap((b) => b.boulders.map((bo) => bo.gradeRaw))
    .filter(Boolean);
  const sortedGrades = Array.from(new Set(gradeList)).sort((a, b) => {
    const dA = GRADE_BY_LABEL[a]?.difficulty ?? 0;
    const dB = GRADE_BY_LABEL[b]?.difficulty ?? 0;
    return dA - dB;
  });
  const gradeSpan =
    sortedGrades.length === 1
      ? sortedGrades[0]
      : sortedGrades.length > 1
      ? `${sortedGrades[0]} – ${sortedGrades[sortedGrades.length - 1]}`
      : '';

  // Context text
  const numBlocks = routine.blocks.length;
  const totalBurns = routine.blocks.reduce(
    (s, b) => s + b.boulders.reduce((bs, bo) => bs + (bo.targetAttempts || 1), 0),
    0
  );
  let contextText = '';
  if (numBlocks > 0) {
    const avgRest = Math.round(
      routine.blocks.reduce((s, b) => s + (b.defaultRestSeconds || 60), 0) / numBlocks
    );
    const restLabel = avgRest >= 60 ? `${Math.round(avgRest / 60)}m rest` : `${avgRest}s rest`;
    contextText = `${numBlocks} Sets • ${totalBurns} Burns`;
  } else {
    contextText = routine.description || 'Structured drill';
  }

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4 mb-3">
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          <Text className="text-white text-[16px] font-bold" numberOfLines={1}>{routine.title}</Text>
          {gradeSpan ? (
            <View className="bg-[#141417] border border-[#6EE756] px-2 py-0.5 rounded-md">
              <Text className="text-[#6EE756] text-[11px] font-bold">{gradeSpan}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => { triggerHaptic('light'); setMenuVisible(true); }}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MoreVertical size={17} color="#8A8A98" />
        </TouchableOpacity>
      </View>

      {/* Footer Row */}
      <View className="flex-row items-center justify-between">
        <Text 
          className="text-[#8A8A98] text-[12px]"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
        >
          {contextText}
        </Text>
        
        <Pressable
          onPress={() => { triggerHaptic('medium'); onStart(routine); }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
          className="h-[36px] px-4 bg-[#141417] border border-[#8E7CFF] rounded-lg items-center justify-center"
        >
          <Text className="text-[#8E7CFF] text-[12px] font-bold">START</Text>
        </Pressable>
      </View>

      {/* Context menu bottom sheet */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/70 justify-end"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View className="bg-[#19191D] rounded-t-xl border-t border-[#27272F] p-5 pb-10">
            <View className="w-[36px] h-[3px] bg-[#27272F] rounded-full self-center mb-4" />
            <Text className="text-white text-[15px] font-bold mb-3" numberOfLines={1}>{routine.title}</Text>

            <TouchableOpacity
              onPress={() => { setMenuVisible(false); onEdit(routine); }}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3.5 border-b border-[#27272F]"
            >
              <Edit3 size={17} color="#FFFFFF" />
              <Text className="text-white text-[15px] font-semibold">Edit Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMenuVisible(false); onDuplicate(routine.id); }}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3.5 border-b border-[#27272F]"
            >
              <Copy size={17} color="#8E7CFF" />
              <Text className="text-[#8E7CFF] text-[15px] font-semibold">Duplicate as Custom</Text>
            </TouchableOpacity>

            {routine.isCustom && (
              <TouchableOpacity
                onPress={() => { setMenuVisible(false); onDelete(routine.id); }}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-3.5"
              >
                <Trash2 size={17} color="#FF453A" />
                <Text className="text-[#FF453A] text-[15px] font-semibold">Delete Routine</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
