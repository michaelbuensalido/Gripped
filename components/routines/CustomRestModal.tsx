import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Timer, Plus, Minus, Check } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

interface CustomRestModalProps {
  visible: boolean;
  initialSeconds: number;
  blockTitle?: string;
  onSave: (seconds: number) => void;
  onClose: () => void;
}

const MIN_REST = 10;
const MAX_REST = 600;

function formatRestMinutes(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0 && s > 0) return `${m} min ${s} sec`;
  if (m > 0) return `${m} min`;
  return `${s} seconds`;
}

export function CustomRestModal({
  visible,
  initialSeconds,
  blockTitle,
  onSave,
  onClose,
}: CustomRestModalProps) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(initialSeconds || 90);
  const [textInput, setTextInput] = useState(String(initialSeconds || 90));

  useEffect(() => {
    if (visible) {
      const clamped = Math.max(MIN_REST, Math.min(MAX_REST, initialSeconds || 90));
      setSeconds(clamped);
      setTextInput(String(clamped));
    }
  }, [visible, initialSeconds]);

  const updateSeconds = (next: number) => {
    const clamped = Math.max(MIN_REST, Math.min(MAX_REST, next));
    setSeconds(clamped);
    setTextInput(String(clamped));
  };

  const handleStep = (delta: number) => {
    triggerHaptic('light');
    updateSeconds(seconds + delta);
  };

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setTextInput(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      setSeconds(Math.max(MIN_REST, Math.min(MAX_REST, parsed)));
    }
  };

  const handleConfirm = () => {
    triggerHaptic('medium');
    const finalSeconds = Math.max(MIN_REST, Math.min(MAX_REST, seconds));
    onSave(finalSeconds);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'rgba(26, 26, 32, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderTopWidth: 1,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Timer size={16} color="#8E7CFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                    Custom Rest Interval
                  </Text>
                </View>
                <Text style={{ color: '#9A9AA6', fontSize: 12, marginTop: 3 }}>
                  {blockTitle ? `Target recovery for ${blockTitle}` : 'Target recovery between burns'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#141418',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Big Hero Display */}
            <View
              style={{
                backgroundColor: '#141418',
                borderColor: '#2C2C35',
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 40,
                  fontWeight: '800',
                  letterSpacing: -1,
                }}
              >
                {seconds}s
              </Text>
              <Text
                style={{
                  color: '#8E7CFF',
                  fontSize: 13,
                  fontWeight: '600',
                  marginTop: 2,
                }}
              >
                {formatRestMinutes(seconds)}
              </Text>
            </View>

            {/* Stepper Buttons (-30s, -10s, +10s, +30s) */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                marginBottom: 18,
              }}
            >
              <TouchableOpacity
                onPress={() => handleStep(-30)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  backgroundColor: '#16161B',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '700' }}>-30s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStep(-10)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  backgroundColor: '#16161B',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '700' }}>-10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStep(10)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  backgroundColor: '#16161B',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '700' }}>+10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStep(30)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  backgroundColor: '#16161B',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '700' }}>+30s</Text>
              </TouchableOpacity>
            </View>

            {/* Direct Input Field */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#16161B',
                borderColor: '#2C2C35',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '600' }}>
                Exact seconds (10–600):
              </Text>
              <TextInput
                value={textInput}
                onChangeText={handleTextChange}
                keyboardType="numeric"
                maxLength={4}
                style={{
                  color: '#8E7CFF',
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'right',
                  width: 70,
                }}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  backgroundColor: '#141418',
                  borderColor: '#2C2C35',
                  borderWidth: 1,
                  paddingVertical: 13,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#9A9AA6', fontSize: 14, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.85}
                style={{
                  flex: 2,
                  backgroundColor: '#8E7CFF',
                  paddingVertical: 13,
                  borderRadius: 22,
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
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                  Set {seconds}s Rest
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
