import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import type { SessionSummary } from '../../db/queries';

interface Props {
  session: SessionSummary;
  isLast?: boolean;
}

const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatShortDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

export function SessionHistoryCard({ session, isLast }: Props) {
  const router = useRouter();
  const peakGrade = session.hardestGrade;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        triggerHaptic('light');
        router.push(`/session/detail/${session.id}`);
      }}
      className={`h-[64px] flex-row items-center justify-between px-4 ${!isLast ? 'border-b border-[#22222A]' : ''}`}
    >
      {/* Left: Date + Title */}
      <View className="flex-1 mr-4">
        <Text 
          className="text-[#8A8A98] text-[11px] uppercase tracking-wider mb-0.5"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
        >
          {formatShortDate(session.startTime)}
        </Text>
        <View className="flex-row items-center">
          {!session.endTime && (
            <View className="w-2 h-2 rounded-full bg-[#6EE756] animate-pulse mr-2" />
          )}
          <Text className={`${!session.endTime ? 'text-[#6EE756]' : 'text-white'} text-[15px] font-bold`} numberOfLines={1}>
            {session.title || session.gymName || 'Bouldering Session'}
          </Text>
        </View>
      </View>

      {/* Center/Right: Grade Badge + Chevron */}
      <View className="flex-row items-center gap-3">
        {peakGrade ? (
          <View className="bg-[#141417] border border-[#2C2C35] rounded-md px-2 py-0.5">
            <Text className="text-white text-[12px] font-bold">{peakGrade}</Text>
          </View>
        ) : (
          session.hasMedia ? (
            <View className="bg-[#141417] border border-[#8E7CFF] rounded-md px-2 py-0.5">
              <Text className="text-[#8E7CFF] text-[10px] font-bold tracking-wider">BETA</Text>
            </View>
          ) : null
        )}
        <ChevronRight size={16} color="#555562" />
      </View>
    </TouchableOpacity>
  );
}
