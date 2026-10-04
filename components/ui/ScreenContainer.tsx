import React from 'react';
import { View, ImageBackground, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withTopInset?: boolean;
}

/**
 * ScreenContainer renders the seamless dark charcoal speckled mat textured
 * background behind safe-area content across all CruxLog screens.
 */
export function ScreenContainer({
  children,
  style,
  withTopInset = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bgTexture }, style]}>
      {/* ── Textured Speckled Gym Mat Background Layer, heavily dimmed ── */}
      <ImageBackground
        source={require('../../assets/speckled_mat_bg.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: colors.backdropImageOpacity }}
        resizeMode="cover"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.backdropScrimTop, colors.backdropScrimBottom]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          flex: 1,
          paddingTop: withTopInset ? insets.top : 0,
        }}
      >
        {children}
      </View>
    </View>
  );
}
