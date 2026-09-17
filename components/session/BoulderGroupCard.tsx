import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Keyboard, Alert, Platform } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import type { BoulderLog } from '../../types';
import { useSessionStore } from '../../store/sessionStore';
import { SetRow } from './SetRow';
import { RestTimerPickerSheet, formatRestDuration } from './RestTimerPickerSheet';
import { BlockActionSheet } from './BlockActionSheet';
import { triggerHaptic } from '../../utils/haptics';

interface BoulderGroupCardProps {
  groupId: string;
  zoneName: string;
  logs: BoulderLog[];
  defaultRestSeconds?: number;
  notes?: string;
  index?: number;
  totalGroups?: number;
}

export function BoulderGroupCard({
  groupId,
  zoneName,
  logs,
  defaultRestSeconds = 90,
  notes = '',
  index = 0,
  totalGroups = 1,
}: BoulderGroupCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(zoneName);
  const [notesValue, setNotesValue] = useState(notes || '');
  const [showRestPicker, setShowRestPicker] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const addLog             = useSessionStore((s) => s.addLog);
  const updateGroupName    = useSessionStore((s) => s.updateGroupName);
  const updateGroupRestTimer = useSessionStore((s) => s.updateGroupRestTimer);
  const updateGroupNotes   = useSessionStore((s) => s.updateGroupNotes);
  const moveGroup          = useSessionStore((s) => s.moveGroup);
  const deleteGroup        = useSessionStore((s) => s.deleteGroup);

  useEffect(() => { setNameValue(zoneName); }, [zoneName]);
  useEffect(() => { setNotesValue(notes || ''); }, [notes]);

  const handleNameSubmit = useCallback(() => {
    setEditing(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== zoneName) {
      updateGroupName(groupId, trimmed);
    } else {
      setNameValue(zoneName);
    }
  }, [nameValue, zoneName, groupId, updateGroupName]);

  const handleNotesBlur = useCallback(() => {
    const trimmed = notesValue.trim();
    if (trimmed !== notes) updateGroupNotes(groupId, trimmed);
  }, [notesValue, notes, groupId, updateGroupNotes]);

  const handleAddLog = useCallback(() => { addLog(groupId); }, [groupId, addLog]);

  const handleSaveRestTimer = useCallback(
    (newSeconds: number) => updateGroupRestTimer(groupId, newSeconds),
    [groupId, updateGroupRestTimer]
  );

  const handleDeleteBlock = useCallback(() => {
    Alert.alert(
      'Delete Block?',
      `Delete "${zoneName}" and all its sets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { triggerHaptic('medium'); deleteGroup(groupId); },
        },
      ]
    );
  }, [zoneName, groupId, deleteGroup]);

  const sends = logs.filter((l) => l.outcome === 'send' || l.outcome === 'flash').length;

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4 mb-4">
      {/* Block Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1 mr-2">
          {editing ? (
            <TextInput
              value={nameValue}
              onChangeText={setNameValue}
              onBlur={handleNameSubmit}
              onSubmitEditing={handleNameSubmit}
              autoFocus
              className="text-white text-[17px] font-bold"
              returnKeyType="done"
            />
          ) : (
            <TouchableOpacity
              onPress={() => setCollapsed((c) => !c)}
              activeOpacity={0.75}
              className="flex-row items-center gap-2"
            >
              <Text className="text-white text-[17px] font-bold" numberOfLines={1}>{zoneName}</Text>
              <View className="bg-[#141417] px-2 py-0.5 rounded-md">
                <Text 
                  className="text-[#8E7CFF] text-[11px]"
                  style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                >
                  {sends}/{logs.length}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => { triggerHaptic('selection'); setShowActionSheet(true); }}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MoreVertical size={18} color="#555562" />
        </TouchableOpacity>
      </View>

      {!collapsed && (
        <TextInput
          value={notesValue}
          onChangeText={setNotesValue}
          onBlur={handleNotesBlur}
          onSubmitEditing={() => { handleNotesBlur(); Keyboard.dismiss(); }}
          returnKeyType="done"
          placeholder="Notes…"
          placeholderTextColor="#333340"
          multiline={false}
          className="text-[#555562] text-[12px] py-1 mb-2"
        />
      )}

      {!collapsed && (
        <View>
          <TouchableOpacity
            onPress={() => { triggerHaptic('light'); setShowRestPicker(true); }}
            activeOpacity={0.75}
            className="py-1 mb-2"
          >
            <Text 
              className="text-[#555562] text-[11px] font-bold tracking-[1.2px]"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              REST  {formatRestDuration(defaultRestSeconds || 90)}
            </Text>
          </TouchableOpacity>

          <View className="mb-2">
            <View className="h-[28px] flex-row items-center justify-between border-b border-[#25252E] px-2 mb-2">
              <Text className="w-[10%] text-[11px] font-bold text-[#555562] uppercase tracking-wider">SET</Text>
              <Text className="w-[20%] text-[11px] font-bold text-[#555562] uppercase tracking-wider text-center">GRADE</Text>
              <Text className="w-[35%] text-[11px] font-bold text-[#555562] uppercase tracking-wider text-center">BURNS</Text>
              <Text className="w-[35%] text-[11px] font-bold text-[#555562] uppercase tracking-wider text-right">LOG</Text>
            </View>

            {logs.map((log, i) => (
              <SetRow key={log.id} log={log} index={i + 1} groupId={groupId} />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleAddLog}
            activeOpacity={0.8}
            className="w-full h-[40px] items-center justify-center rounded-lg border border-dashed border-[#27272F]"
          >
            <Text className="text-[#8A8A98] text-[12px] font-semibold">+ Add Set</Text>
          </TouchableOpacity>
        </View>
      )}

      <RestTimerPickerSheet
        visible={showRestPicker}
        initialSeconds={defaultRestSeconds || 90}
        onClose={() => setShowRestPicker(false)}
        onSave={handleSaveRestTimer}
      />

      <BlockActionSheet
        visible={showActionSheet}
        blockName={zoneName}
        canMoveUp={index > 0}
        canMoveDown={index < totalGroups - 1}
        onClose={() => setShowActionSheet(false)}
        onRename={() => setEditing(true)}
        onMoveUp={() => moveGroup(groupId, 'up')}
        onMoveDown={() => moveGroup(groupId, 'down')}
        onDelete={handleDeleteBlock}
      />
    </View>
  );
}
