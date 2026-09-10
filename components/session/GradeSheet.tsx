import React, { useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X as XIcon } from 'lucide-react-native';
import { GRADES } from '../../constants/grades';

interface GradeSheetProps {
  visible: boolean;
  selectedGrade: string;
  onSelect: (grade: string) => void;
  onClose: () => void;
}

export function GradeSheet({ visible, selectedGrade, onSelect, onClose }: GradeSheetProps) {
  const insets = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: { item: typeof GRADES[0] }) => {
      const isSelected = item.label === selectedGrade;
      return (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => { onSelect(item.label); onClose(); }}
          style={{
            backgroundColor: isSelected ? item.color : '#232323',
            borderWidth: isSelected ? 0 : 1,
            borderColor: '#2E2E2E',
          }}
          className="flex-1 m-1.5 py-4 rounded-2xl items-center justify-center"
        >
          <Text
            style={{ color: isSelected ? item.textColor : '#FFFFFF' }}
            className="text-lg font-black"
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedGrade, onSelect, onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="bg-surface rounded-t-3xl px-4 pt-4"
      >
        {/* Handle + header */}
        <View className="w-10 h-1 bg-border rounded-full self-center mb-4" />
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-bold">Select Grade</Text>
          <TouchableOpacity onPress={onClose} className="p-1">
            <XIcon size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Grade grid — 2 columns */}
        <FlatList
          data={GRADES}
          renderItem={renderItem}
          keyExtractor={(item) => item.label}
          numColumns={2}
          scrollEnabled={false}
        />
      </View>
    </Modal>
  );
}
