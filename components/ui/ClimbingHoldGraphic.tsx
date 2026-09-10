import React from 'react';
import { View, Image, ImageSourcePropType, ViewStyle } from 'react-native';

export type HoldType =
  | 'ripple-effect'
  | 'slab-rise'
  | 'kars-sloper'
  | 'poly-edge'
  | 'purple-sloper'
  | 'yellow-jug'
  | 'orange-facet'
  | 'slab-rise-blue'
  | 'sloper'
  | 'pinch'
  | 'crimp'
  | 'jug'
  | 'volume';

export const HOLD_IMAGES: Record<string, ImageSourcePropType> = {
  // Named routes
  'ripple-effect': require('../../assets/holds-images/v6-ripple-effect-square.jpg'),
  'slab-rise': require('../../assets/holds-images/v5-slab-rise.png'),
  'kars-sloper': require('../../assets/holds-images/v7-kars-sloper.png'),
  'poly-edge': require('../../assets/holds-images/v8-poly-edge.png'),
  'purple-sloper': require('../../assets/holds-images/v4-purple-sloper.png'),
  'yellow-jug': require('../../assets/holds-images/v3-yellow-jug.png'),
  'orange-facet': require('../../assets/holds-images/v6-orange-facet.png'),
  'slab-rise-blue': require('../../assets/holds-images/v7-slab-rlise.png'),

  // Generic hold types mapping
  'sloper': require('../../assets/holds-images/v6-ripple-effect-square.jpg'),
  'pinch': require('../../assets/holds-images/v5-slab-rise.png'),
  'crimp': require('../../assets/holds-images/v8-poly-edge.png'),
  'jug': require('../../assets/holds-images/v3-yellow-jug.png'),
  'volume': require('../../assets/holds-images/v4-purple-sloper.png'),
};

interface ClimbingHoldGraphicProps {
  type?: HoldType | string;
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * ClimbingHoldGraphic Component
 * Renders high-resolution 3D climbing hold images from assets/holds-images.
 */
export function ClimbingHoldGraphic({
  type = 'ripple-effect',
  size = 64,
  borderRadius = 12,
  style,
}: ClimbingHoldGraphicProps) {
  const source = HOLD_IMAGES[type] || HOLD_IMAGES['ripple-effect'];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: '#141416',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
        resizeMode="cover"
      />
    </View>
  );
}
