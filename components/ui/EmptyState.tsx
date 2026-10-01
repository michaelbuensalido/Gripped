import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body: string;
  cta?: React.ReactNode;
}

export function EmptyState({ icon, title, body, cta }: EmptyStateProps) {
  const { colors, type, space } = useTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: space.xl, flex: 1 }}>
      {icon && <View style={{ marginBottom: space.lg }}>{icon}</View>}
      <Text style={[{ color: colors.text, marginBottom: space.sm, textAlign: 'center' }, type.heading]}>{title}</Text>
      <Text style={[{ color: colors.textMuted, textAlign: 'center', marginBottom: space.lg }, type.body]}>{body}</Text>
      {cta && <View style={{ width: '100%' }}>{cta}</View>}
    </View>
  );
}
