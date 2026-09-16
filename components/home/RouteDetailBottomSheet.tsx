import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { Bookmark, Video, X, Check } from 'lucide-react-native';
import type { RecommendedRoute } from './RecommendedRouteCard';
import { triggerHaptic } from '../../utils/haptics';

interface RouteDetailBottomSheetProps {
  visible: boolean;
  route: RecommendedRoute | null;
  onClose: () => void;
  onLogSend: (route: RecommendedRoute) => void;
  onSaveProject: (route: RecommendedRoute) => void;
  onViewBeta: (route: RecommendedRoute) => void;
}

export function RouteDetailBottomSheet({
  visible,
  route,
  onClose,
  onLogSend,
  onSaveProject,
  onViewBeta,
}: RouteDetailBottomSheetProps) {
  if (!route) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'flex-end',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            backgroundColor: '#1E1E24',
            borderTopWidth: 1,
            borderTopColor: '#2C2C35',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 40,
          }}
        >
          {/* Drag Indicator: 36x4pt pill, surface #3E3E48, self-center mb-3 */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: '#3E3E48',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />

          {/* Header Row: Title & Grade Badge + Close Button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 20,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}
              >
                {route.title}
              </Text>

              {/* Grade Badge */}
              <View
                style={{
                  backgroundColor: '#6EE756',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 2.5,
                  shadowColor: '#6EE756',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    color: '#111115',
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {route.grade}
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
                backgroundColor: '#262630',
                borderWidth: 1,
                borderColor: '#2C2C35',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color="#8A8A98" />
            </TouchableOpacity>
          </View>

          {/* Hold Style / Angle Preview Banner */}
          <View
            style={{
              backgroundColor: '#17171C',
              borderWidth: 1,
              borderColor: '#25252E',
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <View
              style={{
                height: 140,
                width: '100%',
                backgroundColor: 'rgba(18, 18, 22, 0.8)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={route.image}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            {/* Hold Style & Angle Tags */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: '#1E1E24',
                  borderWidth: 1,
                  borderColor: '#2C2C35',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '500' }}>
                  {route.holdType || 'Technical Hold'}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: '#1E1E24',
                  borderWidth: 1,
                  borderColor: '#2C2C35',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#8A8A98', fontSize: 12, fontWeight: '500' }}>
                  {route.angle || 'Overhang'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── 2-Tier Action Buttons Group (mt-5 gap-3) ──────────── */}
          <View style={{ marginTop: 20, gap: 12 }}>
            {/* A. Primary Action ("Log Send") */}
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                onLogSend(route);
              }}
              style={({ pressed }) => ({
                width: '100%',
                height: 48,
                borderRadius: 12,
                backgroundColor: '#6EE756',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.92 : 1,
                shadowColor: '#6EE756',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
              })}
            >
              <Check size={18} color="#111115" strokeWidth={2.5} />
              <Text
                style={{
                  color: '#111115',
                  fontSize: 15,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}
              >
                Log Send
              </Text>
            </Pressable>

            {/* B. Secondary Actions Row (2 Columns) */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Left Button: Save as Project */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  onSaveProject(route);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#17171C',
                  borderWidth: 1,
                  borderColor: '#2C2C35',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  opacity: pressed ? 0.92 : 1,
                })}
              >
                <Bookmark size={16} color="#8E7CFF" />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  Save Project
                </Text>
              </Pressable>

              {/* Right Button: View Beta Clip */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  onViewBeta(route);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#17171C',
                  borderWidth: 1,
                  borderColor: '#2C2C35',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  opacity: pressed ? 0.92 : 1,
                })}
              >
                <Video size={16} color="#8A8A98" />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  Beta Video
                </Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
