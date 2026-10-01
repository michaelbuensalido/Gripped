import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';

export interface SessionRowProps {
  id: string;
  gymName: string;
  startedAt: number;
  durationMs: number;
  hardestGrade?: string;
  isLast?: boolean;
}

export function SessionRow({ id, gymName, startedAt, durationMs, hardestGrade, isLast }: SessionRowProps) {
  const router = useRouter();
  const { colors, type, space } = useTheme();

  const d = new Date(startedAt);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const m = Math.floor(durationMs / 60000);
  const h = Math.floor(m / 60);
  const durationStr = h > 0 ? `${h}h ${m % 60}m` : `${m}m`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        triggerHaptic('light');
        router.push(`/session/detail/${id}`);
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: space.lg,
        paddingHorizontal: space.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, marginRight: space.md }}>
        <Text style={[type.heading, { color: colors.text, marginBottom: 2 }]} numberOfLines={1}>
          {gymName || 'Session'}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {dateStr} • {durationStr}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        {hardestGrade && (
          <View style={{ backgroundColor: colors.cardMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={[type.caption, { color: colors.text }]}>{hardestGrade}</Text>
          </View>
        )}
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}
