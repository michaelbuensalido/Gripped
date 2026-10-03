import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';

interface GlowBackdropProps {
  /** How far the glow bleeds past the parent's edges, in px. Defaults to space.xl. */
  spread?: number;
}

let glowCounter = 0;

/**
 * Radial glow for high-value metrics (v3.0 premium depth).
 *
 * Render it as the FIRST child of the thing that should glow (a banner Card, a streak
 * pill). It is absolutely positioned behind the content, ignores touches, and uses the
 * `glow` token (lavender at 15%) so it lifts the metric without hurting text contrast.
 *
 * It is a react-native-svg radial gradient rather than a CSS blur, which React Native
 * does not support.
 */
export function GlowBackdrop({ spread }: GlowBackdropProps) {
  const { colors, space } = useTheme();
  const bleed = spread ?? space.xl;
  const id = React.useRef(`glow-${glowCounter++}`).current;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        top: -bleed,
        left: -bleed,
        right: -bleed,
        bottom: -bleed,
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={colors.glow} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
