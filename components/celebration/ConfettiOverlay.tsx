import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withSequence,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const NUM_PARTICLES = 40;

const COLORS = ['#6EE756', '#8E7CFF', '#FF453A', '#FFFFFF'];

interface ConfettiOverlayProps {
  active: boolean;
}

const Particle = ({ active, index }: { active: boolean; index: number }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(Math.random() * width);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Memoize random values based on index to avoid layout jumps if re-rendered
  const size = React.useMemo(() => Math.random() * 8 + 4, [index]);
  const color = React.useMemo(() => COLORS[Math.floor(Math.random() * COLORS.length)], [index]);

  useEffect(() => {
    if (active) {
      translateY.value = -50;
      translateX.value = Math.random() * width;
      rotate.value = 0;
      opacity.value = 1;

      const duration = Math.random() * 2000 + 2000;
      const delay = Math.random() * 1000;

      translateY.value = withDelay(
        delay,
        withTiming(height + 50, { duration, easing: Easing.linear })
      );
      translateX.value = withDelay(
        delay,
        withTiming(translateX.value + (Math.random() - 0.5) * 150, {
          duration,
          easing: Easing.inOut(Easing.ease),
        })
      );
      rotate.value = withDelay(
        delay,
        withTiming(Math.random() * 720, { duration, easing: Easing.linear })
      );
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: duration * 0.8 }),
          withTiming(0, { duration: duration * 0.2 })
        )
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [active, index, translateY, translateX, rotate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: rotate.value + 'deg' },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
        animatedStyle as any,
      ]}
    />
  );
};

export function ConfettiOverlay({ active }: ConfettiOverlayProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
        <Particle key={i} index={i} active={active} />
      ))}
    </View>
  );
}
