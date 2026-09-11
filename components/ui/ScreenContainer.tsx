import React from 'react';
import { View, ImageBackground, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    <View style={[{ flex: 1, backgroundColor: '#131316' }, style]}>
      {/* ── Textured Speckled Gym Mat Background Layer with Subdued Opacity ── */}
      <ImageBackground
        source={require('../../assets/speckled_mat_bg.jpg')}
        style={StyleSheet.absoluteFillObject}
        imageStyle={{ opacity: 0.22 }}
        resizeMode="cover"
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
