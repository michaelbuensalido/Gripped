import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { BoulderLog } from '../../types';
import { useSessionStore } from '../../store/sessionStore';
import { SetRow } from './SetRow';
import { FLOATING_CARD_STYLE } from '../../constants/theme';

interface BoulderGroupCardProps {
  groupId: string;
  zoneName: string;
  logs: BoulderLog[];
}

export function BoulderGroupCard({ groupId, zoneName, logs }: BoulderGroupCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(zoneName);

  const addLog = useSessionStore((s) => s.addLog);
  const updateGroupName = useSessionStore((s) => s.updateGroupName);

  const handleNameSubmit = useCallback(() => {
    setEditing(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== zoneName) {
      updateGroupName(groupId, trimmed);
    } else {
      setNameValue(zoneName);
    }
  }, [nameValue, zoneName, groupId, updateGroupName]);

  const handleAddLog = useCallback(() => {
    addLog(groupId);
  }, [groupId, addLog]);

  const sends = logs.filter((l) => l.outcome === 'send' || l.outcome === 'flash').length;

  return (
    <View style={FLOATING_CARD_STYLE} className="rounded-2xl mx-4 mb-4 overflow-hidden">
      {/* Card header */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setCollapsed((c) => !c)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-2 flex-1">
          {editing ? (
            <TextInput
              value={nameValue}
              onChangeText={setNameValue}
              onBlur={handleNameSubmit}
              onSubmitEditing={handleNameSubmit}
              autoFocus
              className="text-white font-bold text-base flex-1"
              style={{ color: '#FFFFFF' }}
              returnKeyType="done"
            />
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)} className="flex-1">
              <Text className="text-white font-bold text-base">{zoneName}</Text>
            </TouchableOpacity>
          )}
          <View className="bg-surface rounded-full px-2 py-0.5">
            <Text className="text-secondary text-xs font-semibold">
              {sends}/{logs.length}
            </Text>
          </View>
        </View>
        {collapsed ? (
          <ChevronDown size={18} color="#9CA3AF" />
        ) : (
          <ChevronUp size={18} color="#9CA3AF" />
        )}
      </TouchableOpacity>

      {!collapsed && (
        <View className="px-3 pb-2">
          {/* Column labels */}
          {logs.length > 0 && (
            <View className="flex-row items-center px-1 pb-1 gap-2">
              <Text className="text-muted text-[10px] w-5 text-center">#</Text>
              <Text className="text-muted text-[10px] w-12 text-center">Grade</Text>
              <Text className="text-muted text-[10px] w-20 text-center">RPE</Text>
              <Text className="text-muted text-[10px] w-20 text-center">Att</Text>
              <Text className="text-muted text-[10px] flex-1 text-right pr-1">Send</Text>
            </View>
          )}

          {/* Set rows */}
          {logs.map((log, i) => (
            <SetRow key={log.id} log={log} index={i + 1} groupId={groupId} />
          ))}

          {/* Add Set button */}
          <TouchableOpacity
            onPress={handleAddLog}
            activeOpacity={0.8}
            className="flex-row items-center justify-center gap-2 mt-2 py-3 rounded-xl border border-dashed border-border"
          >
            <Plus size={16} color="#9CA3AF" />
            <Text className="text-secondary text-sm font-semibold">Add Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
