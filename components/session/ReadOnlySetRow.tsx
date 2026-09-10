import React from 'react';
import { View, Text } from 'react-native';
import { Check, Zap, Video } from 'lucide-react-native';
import type { BoulderLog } from '../../types';
import { GRADE_BY_LABEL } from '../../constants/grades';

interface ReadOnlySetRowProps {
  log: BoulderLog;
  index: number;
}

function rpeColor(rpe: number): string {
  if (rpe <= 4) return '#22C55E';
  if (rpe <= 7) return '#EAB308';
  return '#EF4444';
}

export function ReadOnlySetRow({ log, index }: ReadOnlySetRowProps) {
  const grade = GRADE_BY_LABEL[log.gradeRaw];
  const isFlash = log.outcome === 'flash';
  const isSend = log.outcome === 'send';
  const isAttempt = log.outcome === 'attempt';

  return (
    <View className="flex-row items-center py-2.5 px-3 border-b border-border/50 justify-between">
      {/* Left: Index + Grade */}
      <View className="flex-row items-center gap-2.5">
        <Text className="text-muted text-xs font-bold w-5 text-center">{index}</Text>
        <View
          style={{ backgroundColor: grade?.color ?? '#374151' }}
          className="rounded-full px-2.5 py-1 min-w-[44px] items-center justify-center"
        >
          <Text style={{ color: grade?.textColor ?? '#fff' }} className="text-xs font-black">
            {log.gradeRaw}
          </Text>
        </View>

        {/* RPE pill if logged */}
        {log.rpe != null && (
          <View className="bg-surface px-2 py-0.5 rounded-md border border-border">
            <Text
              style={{ color: rpeColor(log.rpe) }}
              className="text-[11px] font-bold"
            >
              RPE {log.rpe}
            </Text>
          </View>
        )}
      </View>

      {/* Right: Attempts count + Outcome badge + Optional video thumbnail */}
      <View className="flex-row items-center gap-2">
        <View className="bg-surface px-2 py-1 rounded-lg border border-border">
          <Text className="text-secondary text-xs font-semibold">
            {log.attempts} {log.attempts === 1 ? 'att' : 'atts'}
          </Text>
        </View>

        {/* Outcome Status Badge */}
        {isFlash && (
          <View className="flex-row items-center gap-1 bg-green-500/20 border border-green-500/40 px-2.5 py-1 rounded-full">
            <Zap size={12} color="#22C55E" fill="#22C55E" />
            <Text className="text-flash text-xs font-black uppercase tracking-wider">
              Flash
            </Text>
          </View>
        )}

        {isSend && (
          <View className="flex-row items-center gap-1 bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-full">
            <Check size={12} color="#A78BFA" strokeWidth={3} />
            <Text className="text-send text-xs font-black uppercase tracking-wider">
              Top
            </Text>
          </View>
        )}

        {isAttempt && (
          <View className="bg-muted/20 border border-border px-2.5 py-1 rounded-full">
            <Text className="text-muted text-xs font-semibold uppercase tracking-wider">
              Attempt
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
