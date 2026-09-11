import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Minus, Plus, X, Check } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

interface RestTimerPickerSheetProps {
  visible: boolean;
  initialSeconds: number;
  onClose: () => void;
  onSave: (seconds: number) => void;
}

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '45s', seconds: 45 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

export function formatRestDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function RestTimerPickerSheet({
  visible,
  initialSeconds,
  onClose,
  onSave,
}: RestTimerPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(initialSeconds || 90);

  useEffect(() => {
    if (visible) {
      setSeconds(initialSeconds || 90);
    }
  }, [visible, initialSeconds]);

  const handleStep = (delta: number) => {
    triggerHaptic('selection');
    setSeconds((prev) => Math.max(10, Math.min(600, prev + delta)));
  };

  const handleSelectPreset = (val: number) => {
    triggerHaptic('selection');
    setSeconds(val);
  };

  const handleConfirm = () => {
    triggerHaptic('success');
    onSave(seconds);
    onClose();
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
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2.5">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: 'rgba(142, 124, 255, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={18} color="#8E7CFF" />
                  </View>
                  <View>
                    <Text className="text-white text-lg font-bold">Default Rest Timer</Text>
                    <Text className="text-[#9A9AA6] text-xs mt-0.5">
                      Time between sends for this block
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

              {/* Hero Time Display */}
              <View
                style={{
                  backgroundColor: '#16161C',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 42,
                    fontWeight: '800',
                    letterSpacing: -1,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatRestDuration(seconds)}
                </Text>
                <Text
                  style={{
                    color: '#8E7CFF',
                    fontSize: 13,
                    fontWeight: '600',
                    marginTop: 2,
                  }}
                >
                  {seconds} seconds countdown
                </Text>
              </View>

              {/* Quick Presets row */}
              <View className="mb-4">
                <Text className="text-[#8A8A98] text-[11px] font-bold uppercase tracking-[1.2px] mb-2 px-1">
                  Quick Presets
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                >
                  {PRESETS.map((p) => {
                    const isActive = seconds === p.seconds;
                    return (
                      <TouchableOpacity
                        key={p.seconds}
                        onPress={() => handleSelectPreset(p.seconds)}
                        activeOpacity={0.75}
                        style={{
                          backgroundColor: isActive ? '#8E7CFF' : '#16161C',
                          borderColor: isActive ? '#8E7CFF' : '#2C2C35',
                          borderWidth: 1,
                          borderRadius: 14,
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          minWidth: 54,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: isActive ? '#FFFFFF' : '#9A9AA6',
                            fontSize: 13,
                            fontWeight: '700',
                          }}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Stepper Adjustment (-15s / +15s) */}
              <View className="flex-row items-center gap-3 mb-5">
                <TouchableOpacity
                  onPress={() => handleStep(-15)}
                  activeOpacity={0.75}
                  style={{
                    flex: 1,
                    backgroundColor: '#16161C',
                    borderColor: '#2C2C35',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Minus size={15} color="#9A9AA6" strokeWidth={2.5} />
                  <Text style={{ color: '#9A9AA6', fontSize: 13, fontWeight: '700' }}>
                    -15s
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleStep(15)}
                  activeOpacity={0.75}
                  style={{
                    flex: 1,
                    backgroundColor: '#16161C',
                    borderColor: '#2C2C35',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Plus size={15} color="#9A9AA6" strokeWidth={2.5} />
                  <Text style={{ color: '#9A9AA6', fontSize: 13, fontWeight: '700' }}>
                    +15s
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Set Rest Timer Button */}
              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.85}
                style={{
                  height: 48,
                  backgroundColor: '#8E7CFF',
                  borderRadius: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  shadowColor: '#8E7CFF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  Set Rest Timer
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
