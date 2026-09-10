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
          style={{ paddingBottom: insets.bottom + 16 }}
          className="bg-surface rounded-t-3xl p-6 border-t border-border max-h-[80%]"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white font-bold text-lg">Climbing Style Tags</Text>
              <Text className="text-muted text-xs">Select wall angle, grip type, or movement</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color="#9CA3AF" />
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
                        ? 'bg-accent/20 border-accent'
                        : 'bg-card border-border'
                    }`}
                  >
                    {isSelected && <Check size={13} color="#7C3AED" strokeWidth={3} />}
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-accent' : 'text-secondary'
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
            className="bg-accent py-3.5 rounded-xl items-center mt-5"
          >
            <Text className="text-white font-bold text-base">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
