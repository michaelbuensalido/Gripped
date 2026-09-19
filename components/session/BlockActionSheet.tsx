import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Edit3, Trash2, X, Layers } from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

interface BlockActionSheetProps {
  visible: boolean;
  blockName: string;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onClose: () => void;
  onRename: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
}

export function BlockActionSheet({
  visible,
  blockName,
  onClose,
  onRename,
  onDelete,
}: BlockActionSheetProps) {
  const insets = useSafeAreaInsets();

  const handleRenamePress = () => {
    triggerHaptic("light");
    onClose();
    // Allow sheet to close before triggering rename edit
    setTimeout(() => {
      onRename();
    }, 200);
  };

  const handleDeletePress = () => {
    triggerHaptic("warning");
    onClose();
    setTimeout(() => {
      Alert.alert(
        "Delete Zone & Sets?",
        `Are you sure you want to permanently delete "${blockName}" and all of its recorded sets? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Zone",
            style: "destructive",
            onPress: () => {
              triggerHaptic("warning");
              onDelete();
            },
          },
        ],
      );
    }, 250);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/70 justify-end">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: "#000000",
                borderColor: "#19191D",
                borderTopWidth: 1,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: Math.max(insets.bottom + 16, 28),
              }}
            >
              {/* Grab handle */}
              <View className="items-center mb-3">
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#383844",
                  }}
                />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-[#27272F]">
                <View className="flex-row items-center gap-2.5">
                  <View>
                    <Text className="text-[#8A8A98] text-[10px] font-bold uppercase tracking-[1.2px]">
                      Zone Controls
                    </Text>
                    <Text
                      className="text-white text-base font-bold"
                      numberOfLines={1}
                    >
                      {blockName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions List */}
              <View className="mt-1">
                {/* 1. Rename Zone */}
                <TouchableOpacity
                  onPress={handleRenamePress}
                  activeOpacity={0.7}
                  className="flex-row items-center py-4 border-b border-[#27272F]"
                >
                  <View className="w-8 items-center justify-center mr-3">
                    <Edit3 size={19} color="#8E7CFF" />
                  </View>
                  <Text className="text-white text-[15px] font-semibold">
                    Rename Zone
                  </Text>
                </TouchableOpacity>

                {/* 2. Delete Zone */}
                <TouchableOpacity
                  onPress={handleDeletePress}
                  activeOpacity={0.7}
                  className="flex-row items-center py-4"
                >
                  <View className="w-8 items-center justify-center mr-3">
                    <Trash2 size={19} color="#FF453A" />
                  </View>
                  <Text className="text-[#FF453A] text-[15px] font-semibold">
                    Delete Zone & Sets
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
