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
      <View
        style={{
          borderBottomColor: '#2C2C35',
          borderBottomWidth: 1,
          backgroundColor: 'rgba(22, 22, 28, 0.6)',
        }}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-2">
          <Layers size={16} color="#8E7CFF" />
          <Text className="text-white font-bold text-base">{zoneName}</Text>
        </View>
        <View
          style={{
            backgroundColor: '#16161C',
            borderColor: '#2C2C35',
            borderWidth: 1,
          }}
          className="px-2.5 py-1 rounded-full"
        >
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
