import React from 'react';
import { View, Text } from 'react-native';
import { Check, Zap } from 'lucide-react-native';
import type { BoulderLog } from '../../types';

interface ReadOnlySetRowProps {
  log: BoulderLog;
  index: number;
}

const FAILURE_LABELS: Record<string, string> = {
  foot_slip: 'Foot Slip',
  pumped: 'Pumped',
  beta_error: 'Beta Error',
  reach_span: 'Reach / Span',
  grip_strength: 'Grip Strength',
};

export function ReadOnlySetRow({ log, index }: ReadOnlySetRowProps) {
  const isFlash = log.outcome === 'flash';
  const isSend = log.outcome === 'send';
  const isAttempt = log.outcome === 'attempt';

  const rawReason = log.failureReason ?? log.failure_reason;
  const failureLabel = rawReason ? FAILURE_LABELS[rawReason] ?? rawReason : null;

  return (
    <View
      style={{
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
        borderBottomWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: Index + High-Contrast Monochrome Grade Pill */}
      <View className="flex-row items-center gap-3">
        <Text
          style={{
            color: '#8A8A98',
            fontSize: 12,
            fontWeight: '700',
            width: 20,
            textAlign: 'center',
          }}
        >
          {index}
        </Text>
        <View
          style={{
            backgroundColor: '#17171C',
            borderColor: '#2C2C35',
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            minWidth: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            {log.gradeRaw}
          </Text>
        </View>
      </View>

      {/* Right: Attempts count + Failure chip + Outcome badge */}
      <View className="flex-row items-center gap-2 flex-wrap justify-end">
        {/* Failure reason chip (if attempt has recorded crux failure) */}
        {failureLabel && (
          <View
            style={{
              backgroundColor: 'rgba(142, 124, 255, 0.12)',
              borderColor: 'rgba(142, 124, 255, 0.3)',
              borderWidth: 1,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2.5,
            }}
          >
            <Text style={{ color: '#8E7CFF', fontSize: 11, fontWeight: '600' }}>
              {failureLabel}
            </Text>
          </View>
        )}

        {/* Attempts count */}
        <View
          style={{
            backgroundColor: '#17171C',
            borderColor: '#2C2C35',
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '600' }}>
            {log.attempts} {log.attempts === 1 ? 'att' : 'atts'}
          </Text>
        </View>

        {/* Outcome Status Badge */}
        {isFlash && (
          <View
            style={{
              backgroundColor: '#6EE756',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Zap size={11} color="#111115" fill="#111115" />
            <Text
              style={{
                color: '#111115',
                fontSize: 12,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}
              className="uppercase"
            >
              Flash
            </Text>
          </View>
        )}

        {isSend && (
          <View
            style={{
              backgroundColor: '#8E7CFF',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}
              className="uppercase"
            >
              Top
            </Text>
          </View>
        )}

        {isAttempt && (
          <View
            style={{
              backgroundColor: '#3E3E48',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
            }}
          >
            <Text
              style={{
                color: '#9A9AA6',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
              className="uppercase"
            >
              Attempt
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
