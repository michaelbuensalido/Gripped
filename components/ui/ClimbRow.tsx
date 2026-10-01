import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { GradePill } from './GradePill';
import { ResultChip, ResultType } from './ResultChip';
import { useTheme } from '../../theme/useTheme';

export function ClimbRow({ climb, onDelete }: { climb: any; onDelete: (id: string) => void }) {
  const { colors, space, type, radius } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        gap: space.md,
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <GradePill gradeIndex={climb.grade_index} label={climb.grade_raw} />
        <ResultChip result={(climb.result as ResultType) || 'attempt'} />
        {climb.attempts > 1 && (
          <Text style={[type.caption, { color: colors.textMuted }]}>×{climb.attempts}</Text>
        )}
      </View>
      <TouchableOpacity testID="delete-climb-btn" onPress={() => onDelete(climb.id)} hitSlop={10}>
        <Trash2 size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}
