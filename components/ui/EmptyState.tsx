import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  /** Optional local illustration — pass require('./path/to/image.png') */
  illustration?: ImageSourcePropType;
  title: string;
  body: string;
  cta?: React.ReactNode;
}

export function EmptyState({ icon, illustration, title, body, cta }: EmptyStateProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: space.xl, flex: 1 }}>
      {illustration ? (
        <Image
          source={illustration}
          style={{ width: 180, height: 140, borderRadius: radius.xl, marginBottom: space.lg }}
          resizeMode="contain"
          accessible={false}
          aria-hidden
        />
      ) : icon ? (
        <View style={{ marginBottom: space.lg }}>{icon}</View>
      ) : null}
      <Text style={[{ color: colors.text, marginBottom: space.sm, textAlign: 'center' }, type.heading]}>{title}</Text>
      <Text style={[{ color: colors.textMuted, textAlign: 'center', marginBottom: space.lg }, type.body]}>{body}</Text>
      {cta && <View style={{ width: '100%' }}>{cta}</View>}
    </View>
  );
}
