import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { ChevronRight, CheckCircle2, Bookmark, Video, X } from 'lucide-react-native';
import type { RecommendedRoute } from './RecommendedRouteCard';
import { triggerHaptic } from '../../utils/haptics';

interface RouteDetailModalProps {
  visible: boolean;
  route: RecommendedRoute | null;
  onClose: () => void;
  onLogSend: (route: RecommendedRoute) => void;
  onSaveProject: (route: RecommendedRoute) => void;
  onViewBeta: (route: RecommendedRoute) => void;
}

export function RouteDetailModal({
  visible,
  route,
  onClose,
  onLogSend,
  onSaveProject,
  onViewBeta,
}: RouteDetailModalProps) {
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
            backgroundColor: '#1C1C23',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 40,
          }}
        >
          {/* Drag Handle */}
          <View
            style={{
              width: 38,
              height: 4,
              backgroundColor: '#383844',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
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
              marginBottom: 18,
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

          {/* Quick Actions */}
          <View style={{ gap: 10 }}>
            {/* Action 1: Log Send */}
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                onLogSend(route);
              }}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: 12,
                backgroundColor: '#8E7CFF',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.92 : 1,
                shadowColor: '#8E7CFF',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              })}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}
              >
                Log Send
              </Text>
            </Pressable>

            {/* Action 2: Save as Project */}
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                onSaveProject(route);
              }}
              style={({ pressed }) => ({
                height: 46,
                borderRadius: 12,
                backgroundColor: '#262630',
                borderWidth: 1,
                borderColor: '#2C2C35',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Bookmark size={17} color="#8E7CFF" />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                Save as Project
              </Text>
            </Pressable>

            {/* Action 3: View Beta Clip */}
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                onViewBeta(route);
              }}
              style={({ pressed }) => ({
                height: 44,
                borderRadius: 12,
                backgroundColor: '#17171C',
                borderWidth: 1,
                borderColor: '#25252E',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Video size={16} color="#8A8A98" />
              <Text
                style={{
                  color: '#8A8A98',
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                View Beta Clip
              </Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
