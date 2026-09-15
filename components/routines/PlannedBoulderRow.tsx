import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Minus, Plus, X } from 'lucide-react-native';
import type { PlannedBoulder } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export interface PlannedBoulderRowProps {
  boulder: PlannedBoulder;
  onPressGrade: () => void;
  onPressStyle: () => void;
  onAttemptsChange: (delta: number) => void;
  onDelete: () => void;
}

export function PlannedBoulderRow({
  boulder,
  onPressGrade,
  onPressStyle,
  onAttemptsChange,
  onDelete,
}: PlannedBoulderRowProps) {
  const hasTags = boulder.styleTags && boulder.styleTags.length > 0;

  return (
    <View
      style={{
        height: 52,
        backgroundColor: '#17171C',
        borderColor: '#25252E',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: Grade badge */}
      <TouchableOpacity
        onPress={onPressGrade}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        style={{
          backgroundColor: '#22222B',
          borderColor: '#2C2C35',
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 8,
          minWidth: 46,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '700',
            letterSpacing: -0.2,
          }}
        >
          {boulder.gradeRaw}
        </Text>
      </TouchableOpacity>

      {/* Center-Left: Wall style chip */}
      <TouchableOpacity
        onPress={onPressStyle}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        style={{
          flex: 1,
          marginLeft: 12,
          marginRight: 8,
          justifyContent: 'center',
        }}
      >
        {hasTags ? (
          <Text
            numberOfLines={1}
            style={{
              color: '#8A8A98',
              fontSize: 12,
              fontWeight: '500',
            }}
          >
            {boulder.styleTags.join(', ')}
          </Text>
        ) : (
          <Text
            style={{
              color: '#5A5A65',
              fontSize: 12,
              fontWeight: '500',
            }}
          >
            + Style
          </Text>
        )}
      </TouchableOpacity>

      {/* Center-Right: Tactile Burn Stepper */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1E1E24',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#2C2C35',
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('selection');
            onAttemptsChange(-1);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1E1E24',
          }}
        >
          <Minus size={14} color="#FFFFFF" />
        </TouchableOpacity>

        <View
          style={{
            paddingHorizontal: 8,
            minWidth: 54,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {boulder.targetAttempts} {boulder.targetAttempts === 1 ? 'burn' : 'burns'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('selection');
            onAttemptsChange(1);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1E1E24',
          }}
        >
          <Plus size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Right: Delete trigger */}
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 4,
        }}
      >
        <X size={16} color="#5A5A65" />
      </TouchableOpacity>
    </View>
  );
}
