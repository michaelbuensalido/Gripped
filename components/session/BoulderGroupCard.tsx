import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Plus, ChevronDown, ChevronUp, Clock, MoreVertical } from 'lucide-react-native';
import type { BoulderLog } from '../../types';
import { useSessionStore } from '../../store/sessionStore';
import { SetRow } from './SetRow';
import { FLOATING_CARD_STYLE } from '../../constants/theme';
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

  const addLog = useSessionStore((s) => s.addLog);
  const updateGroupName = useSessionStore((s) => s.updateGroupName);
  const updateGroupRestTimer = useSessionStore((s) => s.updateGroupRestTimer);
  const updateGroupNotes = useSessionStore((s) => s.updateGroupNotes);
  const moveGroup = useSessionStore((s) => s.moveGroup);
  const deleteGroup = useSessionStore((s) => s.deleteGroup);

  useEffect(() => {
    setNameValue(zoneName);
  }, [zoneName]);

  useEffect(() => {
    setNotesValue(notes || '');
  }, [notes]);

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
    if (trimmed !== notes) {
      updateGroupNotes(groupId, trimmed);
    }
  }, [notesValue, notes, groupId, updateGroupNotes]);

  const handleAddLog = useCallback(() => {
    addLog(groupId);
  }, [groupId, addLog]);

  const handleSaveRestTimer = useCallback(
    (newSeconds: number) => {
      updateGroupRestTimer(groupId, newSeconds);
    },
    [groupId, updateGroupRestTimer]
  );

  const sends = logs.filter((l) => l.outcome === 'send' || l.outcome === 'flash').length;

  return (
    <View style={FLOATING_CARD_STYLE} className="rounded-2xl mx-4 mb-4 overflow-hidden">
      {/* Card header */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
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
              <TouchableOpacity
                onPress={() => setCollapsed((c) => !c)}
                activeOpacity={0.75}
                className="flex-row items-center gap-2 flex-1"
              >
                <Text className="text-white font-bold text-base" numberOfLines={1}>
                  {zoneName}
                </Text>
                <View
                  style={{
                    backgroundColor: '#16161C',
                    borderColor: '#2C2C35',
                    borderWidth: 1,
                  }}
                  className="rounded-full px-2.5 py-0.5"
                >
                  <Text className="text-[#9A9AA6] text-xs font-semibold">
                    <Text className="text-white font-bold">{sends}</Text>/{logs.length}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Right actions: 3-dot overflow + collapse chevron */}
          <View className="flex-row items-center gap-0.5">
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setShowActionSheet(true);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 38,
                height: 38,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoreVertical size={19} color="#9A9AA6" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCollapsed((c) => !c)}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 38,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {collapsed ? (
                <ChevronDown size={18} color="#8A8A98" />
              ) : (
                <ChevronUp size={18} color="#8A8A98" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline Block Notes Input */}
        {!collapsed && (
          <View className="mt-1 mb-1">
            <TextInput
              value={notesValue}
              onChangeText={setNotesValue}
              onBlur={handleNotesBlur}
              placeholder="Add notes here..."
              placeholderTextColor="#555562"
              multiline={false}
              className="text-[#9A9AA6] text-[13px] py-1"
              style={{ color: '#9A9AA6' }}
            />
          </View>
        )}
      </View>

      {!collapsed && (
        <View className="px-3 pb-3">
          {/* Rest Timer Link Row */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setShowRestPicker(true);
            }}
            activeOpacity={0.75}
            className="flex-row items-center gap-1.5 px-1 py-1 mb-2.5"
          >
            <Clock size={14} color="#8E7CFF" />
            <Text style={{ color: '#8E7CFF', fontSize: 13, fontWeight: '600' }}>
              Rest Timer: {formatRestDuration(defaultRestSeconds || 90)}
            </Text>
          </TouchableOpacity>

          {/* Column labels */}
          {logs.length > 0 && (
            <View className="flex-row items-center px-1 pb-1 gap-2">
              <Text className="text-[#8A8A98] text-[10px] w-5 text-center font-bold">#</Text>
              <Text className="text-[#8A8A98] text-[10px] w-12 text-center font-bold">Grade</Text>
              <Text className="text-[#8A8A98] text-[10px] w-20 text-center font-bold">RPE</Text>
              <Text className="text-[#8A8A98] text-[10px] w-20 text-center font-bold">Att</Text>
              <Text className="text-[#8A8A98] text-[10px] flex-1 text-right pr-1 font-bold">Send</Text>
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
            style={{
              borderColor: '#2C2C35',
              backgroundColor: '#16161C',
            }}
            className="flex-row items-center justify-center gap-2 mt-2 py-3 rounded-xl border border-dashed"
          >
            <Plus size={15} color="#8E7CFF" strokeWidth={2.5} />
            <Text style={{ color: '#8E7CFF' }} className="text-sm font-bold">Add Set</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Per-Block Rest Timer Picker Sheet */}
      <RestTimerPickerSheet
        visible={showRestPicker}
        initialSeconds={defaultRestSeconds || 90}
        onClose={() => setShowRestPicker(false)}
        onSave={handleSaveRestTimer}
      />

      {/* 3-Dot Overflow Menu Block Action Sheet */}
      <BlockActionSheet
        visible={showActionSheet}
        blockName={zoneName}
        canMoveUp={index > 0}
        canMoveDown={index < totalGroups - 1}
        onClose={() => setShowActionSheet(false)}
        onRename={() => setEditing(true)}
        onMoveUp={() => moveGroup(groupId, 'up')}
        onMoveDown={() => moveGroup(groupId, 'down')}
        onDelete={() => deleteGroup(groupId)}
      />
    </View>
  );
}
