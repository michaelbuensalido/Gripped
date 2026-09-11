import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Edit3,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Layers,
} from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

interface BlockActionSheetProps {
  visible: boolean;
  blockName: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onRename: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function BlockActionSheet({
  visible,
  blockName,
  canMoveUp,
  canMoveDown,
  onClose,
  onRename,
  onMoveUp,
  onMoveDown,
  onDelete,
}: BlockActionSheetProps) {
  const insets = useSafeAreaInsets();

  const handleRenamePress = () => {
    triggerHaptic('light');
    onClose();
    // Allow sheet to close before triggering rename edit
    setTimeout(() => {
      onRename();
    }, 200);
  };

  const handleMoveUpPress = () => {
    triggerHaptic('selection');
    onMoveUp();
    onClose();
  };

  const handleMoveDownPress = () => {
    triggerHaptic('selection');
    onMoveDown();
    onClose();
  };

  const handleDeletePress = () => {
    triggerHaptic('warning');
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Delete Zone & Sets?',
        `Are you sure you want to permanently delete "${blockName}" and all of its recorded sets? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Zone',
            style: 'destructive',
            onPress: () => {
              triggerHaptic('warning');
              onDelete();
            },
          },
        ]
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
                backgroundColor: 'rgba(26, 26, 32, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
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
                    backgroundColor: '#383844',
                  }}
                />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-[#2C2C35]">
                <View className="flex-row items-center gap-2.5">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: '#16161C',
                      borderColor: '#2C2C35',
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Layers size={18} color="#8E7CFF" />
                  </View>
                  <View>
                    <Text className="text-[#8A8A98] text-[10px] font-bold uppercase tracking-[1.2px]">
                      Zone Controls
                    </Text>
                    <Text className="text-white text-base font-bold" numberOfLines={1}>
                      {blockName}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#16161C',
                    borderColor: '#2C2C35',
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} color="#9A9AA6" />
                </TouchableOpacity>
              </View>

              {/* Actions List */}
              <View style={{ gap: 8 }}>
                {/* 1. Rename Zone */}
                <TouchableOpacity
                  onPress={handleRenamePress}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: '#16161C',
                    borderColor: '#2C2C35',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: 'rgba(142, 124, 255, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Edit3 size={17} color="#8E7CFF" />
                    </View>
                    <View>
                      <Text className="text-white text-sm font-semibold">
                        Rename Zone
                      </Text>
                      <Text className="text-[#9A9AA6] text-xs">
                        Change wall name or title
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* 2. Move Up (if applicable) */}
                {canMoveUp && (
                  <TouchableOpacity
                    onPress={handleMoveUpPress}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: '#16161C',
                      borderColor: '#2C2C35',
                      borderWidth: 1,
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: '#202026',
                          borderColor: '#2C2C35',
                          borderWidth: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ArrowUp size={17} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text className="text-white text-sm font-semibold">
                          Move Zone Up
                        </Text>
                        <Text className="text-[#9A9AA6] text-xs">
                          Reorder earlier in this workout
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 3. Move Down (if applicable) */}
                {canMoveDown && (
                  <TouchableOpacity
                    onPress={handleMoveDownPress}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: '#16161C',
                      borderColor: '#2C2C35',
                      borderWidth: 1,
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: '#202026',
                          borderColor: '#2C2C35',
                          borderWidth: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ArrowDown size={17} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text className="text-white text-sm font-semibold">
                          Move Zone Down
                        </Text>
                        <Text className="text-[#9A9AA6] text-xs">
                          Reorder later in this workout
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 4. Delete Zone */}
                <TouchableOpacity
                  onPress={handleDeletePress}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: '#16161C',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={17} color="#FF5C5C" />
                    </View>
                    <View>
                      <Text className="text-[#FF5C5C] text-sm font-semibold">
                        Delete Zone & Sets
                      </Text>
                      <Text className="text-[#9A9AA6] text-xs">
                        Permanently remove this entire block
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                style={{
                  height: 48,
                  backgroundColor: '#16161C',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 14,
                }}
              >
                <Text className="text-[#9A9AA6] text-sm font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
