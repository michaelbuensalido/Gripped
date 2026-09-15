import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import {
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
} from 'lucide-react-native';
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

  // Compute concise Grade Span (e.g. "V4 – V7" or "V5")
  const gradeList = routine.blocks
    .flatMap((b) => b.boulders.map((bo) => bo.gradeRaw))
    .filter(Boolean);

  const sortedGrades = Array.from(new Set(gradeList)).sort((a, b) => {
    const diffA = GRADE_BY_LABEL[a]?.difficulty ?? 0;
    const diffB = GRADE_BY_LABEL[b]?.difficulty ?? 0;
    return diffA - diffB;
  });

  let gradeSpanText = '';
  if (sortedGrades.length === 1) {
    gradeSpanText = sortedGrades[0];
  } else if (sortedGrades.length > 1) {
    gradeSpanText = `${sortedGrades[0]} – ${sortedGrades[sortedGrades.length - 1]}`;
  }

  // Calculate Climbing Context Breakdown (Blocks • Total Burns • Rest)
  const numBlocks = routine.blocks.length;
  const totalBurns = routine.blocks.reduce(
    (sum, b) =>
      sum +
      b.boulders.reduce((bSum, bo) => bSum + (bo.targetAttempts || 1), 0),
    0
  );

  let contextText = '';
  if (numBlocks > 0) {
    const avgRestSeconds = Math.round(
      routine.blocks.reduce((s, b) => s + (b.defaultRestSeconds || 60), 0) /
        numBlocks
    );
    const restLabel =
      avgRestSeconds >= 60
        ? `${Math.round(avgRestSeconds / 60)}m rest`
        : `${avgRestSeconds}s rest`;
    contextText = `${numBlocks} ${
      numBlocks === 1 ? 'block' : 'blocks'
    } • ${totalBurns} total ${
      totalBurns === 1 ? 'burn' : 'burns'
    } • ${restLabel} between sets`;
  } else if (routine.description) {
    contextText = routine.description;
  } else {
    contextText = 'Structured climbing drill • Untracked';
  }

  // Collect unique style tags from boulders
  const rawTags = Array.from(
    new Set(
      routine.blocks.flatMap((b) =>
        b.boulders.flatMap((bo) => bo.styleTags || [])
      )
    )
  ).filter(Boolean);

  // Fallback to category & general tags if boulder tags are empty
  const displayTags =
    rawTags.length > 0
      ? rawTags.slice(0, 4)
      : [routine.category, 'Structured'];

  return (
    <View
      style={{
        backgroundColor: '#1E1E24',
        borderWidth: 1,
        borderColor: '#2C2C35',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* ── Card Header: Title + Grade Badge (Left) & 3-Dot Menu (Right) ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        {/* Left: Routine Title + Grade Target Badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            paddingRight: 8,
            flexWrap: 'wrap',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 17,
              fontWeight: '700',
              letterSpacing: -0.2,
            }}
          >
            {routine.title}
          </Text>

          {gradeSpanText ? (
            <View
              style={{
                backgroundColor: '#17171C',
                borderWidth: 1,
                borderColor: '#2C2C35',
                paddingHorizontal: 10,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  color: '#6EE756',
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}
              >
                {gradeSpanText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Right: 3-Dot Context Menu Trigger with 44x44pt touch area */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setMenuVisible(true);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MoreVertical size={18} color="#5A5A65" />
        </TouchableOpacity>
      </View>

      {/* ── Climbing Context Breakdown ─────────────────────────────── */}
      <Text
        style={{
          color: '#8A8A98',
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
        numberOfLines={2}
      >
        {contextText}
      </Text>

      {/* ── Style Tags Row ─────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {displayTags.map((tag, idx) => (
          <View
            key={`${tag}-${idx}`}
            style={{
              backgroundColor: '#17171C',
              borderWidth: 1,
              borderColor: '#25252E',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '500',
              }}
            >
              {tag}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Full-Width Primary Action Button ───────────────────────── */}
      <Pressable
        onPress={() => {
          triggerHaptic('medium');
          onStart(routine);
        }}
        style={({ pressed }) => ({
          width: '100%',
          height: 44,
          borderRadius: 12,
          backgroundColor: '#8E7CFF',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 16,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.92 : 1,
          shadowColor: '#8E7CFF',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
          elevation: 3,
        })}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '700',
            letterSpacing: 0.2,
          }}
        >
          Start Routine
        </Text>
      </Pressable>

      {/* ── Context Menu Modal ─────────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              backgroundColor: 'rgba(28, 28, 35, 0.95)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              borderTopWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              paddingBottom: 40,
            }}
          >
            {/* Drag Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#374151',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 16,
              }}
              numberOfLines={1}
            >
              {routine.title}
            </Text>

            {/* Edit */}
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                onEdit(routine);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <Edit3 size={18} color="#FFFFFF" />
              <Text
                style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}
              >
                Edit Routine
              </Text>
            </TouchableOpacity>

            {/* Duplicate */}
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                onDuplicate(routine.id);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <Copy size={18} color="#8E7CFF" />
              <Text
                style={{ color: '#8E7CFF', fontSize: 16, fontWeight: '600' }}
              >
                Duplicate as Custom
              </Text>
            </TouchableOpacity>

            {/* Delete (Custom Only) */}
            {routine.isCustom && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  onDelete(routine.id);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  marginTop: 4,
                }}
              >
                <Trash2 size={18} color="#FF5C5C" />
                <Text
                  style={{ color: '#FF5C5C', fontSize: 16, fontWeight: '600' }}
                >
                  Delete Routine
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
