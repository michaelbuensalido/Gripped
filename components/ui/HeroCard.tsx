import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';

import { Image } from 'react-native';

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
        backgroundColor: 'rgba(255, 255, 255, 0.04)', // Edge-to-edge material
      }, style]}
      {...props}
    >
      <View style={{ position: 'absolute', top: -20, right: -40 }} pointerEvents="none">
        <Image 
          source={require('../../assets/holds-images/v4-purple-sloper.png')} 
          style={{
            width: 180,
            height: 180,
            opacity: 0.8,
          }}
          resizeMode="contain"
        />
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
                color: colors.textWhitePrimary,
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
          <Text style={[type.caption, { color: colors.textWhiteSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </Card>
  );
}

