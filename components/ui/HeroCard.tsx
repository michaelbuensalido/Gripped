import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';

// A single large, clearly recognisable rounded climbing hold — partly off the
// card edge at top-right, 8% opacity, decorative only.
function HoldSilhouette() {
  const { colors } = useTheme();
  return (
    <Svg
      width={140}
      height={140}
      viewBox="0 0 140 140"
      accessible={false}
    >
      {/* Rounded jug / sloper shape with a scoop — recognisable as a hold */}
      <Path
        d="M110 10 C130 14, 144 38, 140 65 C136 92, 118 118, 90 124 C62 130, 38 114, 28 90 C18 66, 24 44, 42 28 C60 12, 90 6, 110 10 Z M80 40 C66 44, 56 58, 60 72 C64 86, 78 92, 92 88 C106 84, 112 70, 108 56 C104 42, 94 36, 80 40 Z"
        fill={colors.accent}
        fillRule="evenodd"
        opacity={0.08}
      />
    </Svg>
  );
}

export interface HeroCardProps extends ViewProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  children?: React.ReactNode;
}

export function HeroCard({ title, subtitle, value, children, style, ...props }: HeroCardProps) {
  const { colors, space, type } = useTheme();

  return (
    <Card
      style={[{
        overflow: 'hidden',
        position: 'relative',
        padding: space.xl,
      }, style]}
      {...props}
    >
      {/* Decorative hold silhouette — top-right, partly off-edge */}
      <View style={{ position: 'absolute', top: -20, right: -20 }} pointerEvents="none">
        <HoldSilhouette />
      </View>

      <View style={{ marginBottom: children ? space.lg : 0 }}>
        <Text style={[type.label, { color: colors.accentText, marginBottom: space.xs }]}>
          {title}
        </Text>
        {value !== undefined && (
          <Text
            style={[
              type.stat,
              {
                color: colors.text,
                fontSize: 32,
                marginBottom: space.xs,
                fontVariant: ['tabular-nums'],
              },
            ]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
        {subtitle && (
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </Card>
  );
}

