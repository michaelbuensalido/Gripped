import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

export interface RecommendedRoute {
  id: string;
  title: string;
  grade: string;
  image: any;
  holdType?: string;
  angle?: string;
}

interface RecommendedRouteCardProps {
  route: RecommendedRoute;
  onPress: (route: RecommendedRoute) => void;
}

export function RecommendedRouteCard({ route, onPress }: RecommendedRouteCardProps) {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic('light');
        onPress(route);
      }}
      style={({ pressed }) => ({
        width: 154,
        height: 168,
        borderRadius: 20,
        backgroundColor: '#1E1E24',
        borderWidth: 1,
        borderColor: '#2C2C35',
        padding: 8,
        justifyContent: 'space-between',
        transform: [{ scale: pressed ? 0.95 : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* Hold Graphic: 3D volume sitting directly on dark surface */}
      <View
        style={{
          width: '100%',
          height: 114,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: 'rgba(18, 18, 22, 0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={route.image}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />

        {/* Top Left: Translucent grade pill */}
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(20, 20, 26, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.16)',
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 9,
            paddingVertical: 2.5,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            {route.grade}
          </Text>
        </View>
      </View>

      {/* Bottom label: Route title in 14pt SemiBold white */}
      <View style={{ paddingHorizontal: 4, paddingBottom: 2 }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'left',
          }}
          numberOfLines={1}
        >
          {route.title}
        </Text>
      </View>
    </Pressable>
  );
}
