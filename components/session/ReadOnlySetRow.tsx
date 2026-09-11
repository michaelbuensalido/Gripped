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
    <View
      style={{
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
        borderBottomWidth: 1,
      }}
      className="flex-row items-center py-2.5 px-3 justify-between"
    >
      {/* Left: Index + Grade */}
      <View className="flex-row items-center gap-2.5">
        <Text className="text-muted text-xs font-bold w-5 text-center">{index}</Text>
        <View
          style={{ backgroundColor: grade?.color ?? '#2C2C35' }}
          className="rounded-full px-2.5 py-1 min-w-[44px] items-center justify-center"
        >
          <Text style={{ color: grade?.textColor ?? '#fff' }} className="text-xs font-black">
            {log.gradeRaw}
          </Text>
        </View>

        {/* RPE pill if logged */}
        {log.rpe != null && (
          <View
            style={{ backgroundColor: '#16161C', borderColor: '#2C2C35' }}
            className="px-2 py-0.5 rounded-md border"
          >
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
        <View
          style={{ backgroundColor: '#16161C', borderColor: '#2C2C35' }}
          className="px-2 py-1 rounded-lg border"
        >
          <Text className="text-secondary text-xs font-semibold">
            {log.attempts} {log.attempts === 1 ? 'att' : 'atts'}
          </Text>
        </View>

        {/* Outcome Status Badge */}
        {isFlash && (
          <View
            style={{
              backgroundColor: 'rgba(110, 231, 86, 0.15)',
              borderColor: '#6EE756',
            }}
            className="flex-row items-center gap-1 border px-2.5 py-1 rounded-full"
          >
            <Zap size={12} color="#6EE756" fill="#6EE756" />
            <Text
              style={{ color: '#6EE756' }}
              className="text-xs font-black uppercase tracking-wider"
            >
              Flash
            </Text>
          </View>
        )}

        {isSend && (
          <View
            style={{
              backgroundColor: 'rgba(142, 124, 255, 0.15)',
              borderColor: '#8E7CFF',
            }}
            className="flex-row items-center gap-1 border px-2.5 py-1 rounded-full"
          >
            <Check size={12} color="#8E7CFF" strokeWidth={3} />
            <Text
              style={{ color: '#8E7CFF' }}
              className="text-xs font-black uppercase tracking-wider"
            >
              Top
            </Text>
          </View>
        )}

        {isAttempt && (
          <View
            style={{
              backgroundColor: 'rgba(232, 222, 181, 0.12)',
              borderColor: 'rgba(232, 222, 181, 0.4)',
            }}
            className="border px-2.5 py-1 rounded-full"
          >
            <Text
              style={{ color: '#E8DEB5' }}
              className="text-xs font-bold uppercase tracking-wider"
            >
              Attempt
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
