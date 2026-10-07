import React from 'react';
import { ViewStyle, StyleSheet, ViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export function PageTransition({ children, style, ...props }: ViewProps & { children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
