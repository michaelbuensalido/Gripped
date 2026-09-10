import React from 'react';
import { View, Text } from 'react-native';
import { Layers } from 'lucide-react-native';
import type { BoulderLog } from '../../types';
import { ReadOnlySetRow } from './ReadOnlySetRow';
import { FLOATING_CARD_STYLE } from '../../constants/theme';

interface ReadOnlyBoulderGroupProps {
  zoneName: string;
  logs: BoulderLog[];
}

export function ReadOnlyBoulderGroup({ zoneName, logs }: ReadOnlyBoulderGroupProps) {
  const sends = logs.filter((l) => l.outcome === 'send' || l.outcome === 'flash').length;

  return (
    <View style={FLOATING_CARD_STYLE} className="rounded-2xl mx-4 mb-4 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface/40 border-b border-border">
        <View className="flex-row items-center gap-2">
          <Layers size={16} color="#7C3AED" />
          <Text className="text-white font-bold text-base">{zoneName}</Text>
        </View>
        <View className="bg-card px-2.5 py-1 rounded-full border border-border">
          <Text className="text-secondary text-xs font-semibold">
            <Text className="text-white font-bold">{sends}</Text>/{logs.length} sends
          </Text>
        </View>
      </View>

      {/* Set rows */}
      {logs.length === 0 ? (
        <View className="py-4 items-center">
          <Text className="text-muted text-xs">No climbs logged in this zone</Text>
        </View>
      ) : (
        logs.map((log, index) => (
          <ReadOnlySetRow key={log.id} log={log} index={index + 1} />
        ))
      )}
    </View>
  );
}
