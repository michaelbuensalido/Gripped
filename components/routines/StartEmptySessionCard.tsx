import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Zap, ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

interface StartEmptySessionCardProps {
  onPress: () => void;
}

export function StartEmptySessionCard({ onPress }: StartEmptySessionCardProps) {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic('light');
        onPress();
      }}
      style={({ pressed }) => ({
        width: '100%',
        backgroundColor: '#1E1E24',
        borderWidth: 1,
        borderColor: '#2C2C35',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* Left Group */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
        {/* Icon Container: 42x42pt rounded-xl, background rgba(142, 124, 255, 0.15), border 1px rgba(142, 124, 255, 0.3) */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: 'rgba(142, 124, 255, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(142, 124, 255, 0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={20} color="#8E7CFF" fill="#8E7CFF" />
        </View>

        {/* Text Column */}
        <View style={{ flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: -0.2,
            }}
          >
            Start Empty Session
          </Text>
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 12,
              fontWeight: '400',
              marginTop: 2,
            }}
          >
            Freestyle climb • Log as you go
          </Text>
        </View>
      </View>

      {/* Right Group: Chevron */}
      <ChevronRight size={20} color="#5A5A65" />
    </Pressable>
  );
}
