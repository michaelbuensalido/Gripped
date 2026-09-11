import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { X, Trash2, RotateCcw, Check, Film, Camera } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import type { Outcome } from '../../types';

interface BetaPreviewModalProps {
  visible: boolean;
  mediaUri: string | null;
  mediaType?: 'video' | 'photo' | null;
  setIndex: number;
  gradeRaw: string;
  outcome?: Outcome;
  onClose: () => void;
  onRetake: () => void;
  onDelete: () => void;
}

export function BetaPreviewModal({
  visible,
  mediaUri,
  mediaType = 'video',
  setIndex,
  gradeRaw,
  outcome = 'attempt',
  onClose,
  onRetake,
  onDelete,
}: BetaPreviewModalProps) {
  if (!visible || !mediaUri) return null;

  const isSent = outcome === 'send' || outcome === 'flash';
  const isFlash = outcome === 'flash';

  const handleDelete = () => {
    triggerHaptic('warning');
    onDelete();
    onClose();
  };

  const handleRetake = () => {
    triggerHaptic('medium');
    onClose();
    onRetake();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.gradePill,
                  {
                    backgroundColor: isFlash
                      ? '#6EE756'
                      : isSent
                      ? '#8E7CFF'
                      : '#2C2C35',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gradePillText,
                    { color: isFlash ? '#111115' : '#FFFFFF' },
                  ]}
                >
                  {gradeRaw}
                </Text>
              </View>
              <View>
                <Text style={styles.title}>Set #{setIndex} Beta</Text>
                <Text style={styles.subtitle}>
                  {mediaType === 'video' ? 'Video Recording' : 'Hold Photo'} •{' '}
                  {isFlash ? '⚡ Flash' : isSent ? '✓ Sent' : 'Attempt'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Media Viewport */}
          <View style={styles.viewport}>
            {mediaType === 'video' ? (
              <Video
                source={{ uri: mediaUri }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                isLooping
                shouldPlay
              />
            ) : (
              <Image
                source={{ uri: mediaUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteBtn}
              activeOpacity={0.75}
            >
              <Trash2 size={16} color="#FF5C5C" style={{ marginRight: 5 }} />
              <Text style={styles.deleteBtnText}>Remove</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRetake}
              style={styles.retakeBtn}
              activeOpacity={0.8}
            >
              <RotateCcw size={16} color="#8E7CFF" style={{ marginRight: 5 }} />
              <Text style={styles.retakeBtnText}>Re-record</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.doneBtn}
              activeOpacity={0.85}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 5 }} />
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: screenHeight * 0.85,
    backgroundColor: '#1A1A20',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2C2C35',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePillText: {
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9A9AA6',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    width: '100%',
    height: 380,
    backgroundColor: '#0D0D11',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#1E1E24',
    gap: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 92, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
  },
  deleteBtnText: {
    color: '#FF5C5C',
    fontSize: 13,
    fontWeight: '700',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(142, 124, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.25)',
  },
  retakeBtnText: {
    color: '#8E7CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8E7CFF',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
