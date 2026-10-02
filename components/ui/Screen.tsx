import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/useTheme';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  headerRight?: React.ReactNode;
}

export function Screen({ children, title, subtitle, scroll = true, headerRight }: ScreenProps) {
  const { colors, type, space } = useTheme();
  const insets = useSafeAreaInsets();

  const Container = scroll ? ScrollView : View;
  const contentContainerStyle = scroll ? { paddingBottom: 100 } : undefined;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }]}>
      {/* Texture background would go here if implemented, using ImageBackground */}
      <Container contentContainerStyle={contentContainerStyle} style={{ flex: 1 }}>
        <View style={{ paddingTop: Math.max(insets.top, space.xxl), paddingHorizontal: space.lg }}>
          {title && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.xl }}>
              <View>
                <Text style={[{ color: colors.text }, type.display]}>{title}</Text>
                {subtitle && <Text style={[{ color: colors.textMuted, marginTop: space.xs }, type.body]}>{subtitle}</Text>}
              </View>
              {headerRight && <View>{headerRight}</View>}
            </View>
          )}
          {children}
        </View>
      </Container>
    </View>
  );
}
