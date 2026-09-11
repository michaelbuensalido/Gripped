import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';

export const COMMON_STYLE_TAGS = [
  'Overhang',
  'Slab',
  'Roof',
  'Vertical',
  'Dyno',
  'Crimpy',
  'Slopers',
  'Pinches',
  'Compression',
  'Technical',
  'Power',
  'Footwork',
  'Flow',
  'Pumpy',
  'Heel Hook',
  'Toe Hook',
];

interface StyleTagPickerModalProps {
  visible: boolean;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClose: () => void;
}

export function StyleTagPickerModal({
  visible,
  selectedTags,
  onToggleTag,
  onClose,
}: StyleTagPickerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-end">
        <View
          style={{
            paddingBottom: insets.bottom + 16,
            backgroundColor: 'rgba(26, 26, 32, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderTopWidth: 1,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            maxHeight: '80%',
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white font-bold text-lg">Climbing Style Tags</Text>
              <Text className="text-[#9A9AA6] text-xs">Select wall angle, grip type, or movement</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color="#9A9AA6" />
            </TouchableOpacity>
          </View>

          {/* Tags Wrap */}
          <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap gap-2 py-2">
              {COMMON_STYLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => onToggleTag(tag)}
                    activeOpacity={0.75}
                    className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-[#8E7CFF]/20 border-[#8E7CFF]'
                        : 'bg-[#16161C] border-[#2C2C35]'
                    }`}
                  >
                    {isSelected && <Check size={13} color="#8E7CFF" strokeWidth={3} />}
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#8E7CFF]' : 'text-[#9A9AA6]'
                      }`}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Done Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 26,
              backgroundColor: '#8E7CFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
            }}
          >
            <Text className="text-white font-bold text-base">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
