import React from 'react';
import { View, Text } from 'react-native';
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
    <View
      style={[
        FLOATING_CARD_STYLE,
        {
          backgroundColor: '#19191D',
          borderColor: '#27272F',
          borderWidth: 1,
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 16,
        },
      ]}
    >
      {/* Header */}
      <View
        style={{
          borderBottomColor: '#27272F',
          borderBottomWidth: 1,
          backgroundColor: '#141417',
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: '#9090A0',
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 0.8,
          }}
          className="uppercase"
        >
          {zoneName}
        </Text>
        <View
          style={{
            backgroundColor: '#19191D',
            borderColor: '#27272F',
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 9999,
          }}
        >
          <Text style={{ color: '#9090A0', fontSize: 12, fontWeight: '600' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{sends}</Text>/{logs.length} sends
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
