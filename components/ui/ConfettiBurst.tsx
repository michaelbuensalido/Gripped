import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

// Confetti palette drawn from CruxLog design tokens
const CONFETTI_COLORS = [
  '#8E7CFF', // Lavender
  '#6EE756', // Flash Green
  '#FF5C8A', // Electric Pink
  '#F59E0B', // Gold
  '#FFFFFF', // White
];

type ParticleShape = 'rect' | 'circle' | 'square';

interface ParticleData {
  id: number;
  color: string;
  shape: ParticleShape;
  width: number;
  height: number;
  borderRadius: number;
  xSpread: number;       // -160 to +160 pt
  yPop: number;          // -60 to -120 pt (upward apex)
  yFall: number;         // +300 to +500 pt (gravity fall)
  peakProgress: number;  // 0.18 to 0.28
  rotation: number;      // -720 to +720 deg
  flipRotation: number;  // -720 to +720 deg (3D tumbling)
  wobbleFreq: number;    // Flutter frequency
  wobbleAmp: number;     // Flutter amplitude
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateParticles(count: number): ParticleData[] {
  const particles: ParticleData[] = [];
  const shapes: ParticleShape[] = ['rect', 'circle', 'square'];

  for (let i = 0; i < count; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];

    let width = 6;
    let height = 6;
    let borderRadius = 1;

    if (shape === 'rect') {
      width = 8;
      height = 4;
      borderRadius = 1;
    } else if (shape === 'circle') {
      width = 12; // 6pt radius
      height = 12;
      borderRadius = 6;
    } else {
      width = 6;
      height = 6;
      borderRadius = 1;
    }

    // Bias X spread so particles burst in both directions
    const dir = Math.random() > 0.5 ? 1 : -1;
    const xSpread = dir * randomBetween(20, 160);

    particles.push({
      id: i,
      color,
      shape,
      width,
      height,
      borderRadius,
      xSpread,
      yPop: -randomBetween(60, 120),
      yFall: randomBetween(300, 500),
      peakProgress: randomBetween(0.18, 0.28),
      rotation: (Math.random() > 0.5 ? 1 : -1) * randomBetween(360, 720),
      flipRotation: (Math.random() > 0.5 ? 1 : -1) * randomBetween(360, 720),
      wobbleFreq: randomBetween(1.5, 3.5),
      wobbleAmp: randomBetween(4, 12),
    });
  }

  return particles;
}

interface ParticleProps {
  particle: ParticleData;
  progress: SharedValue<number>;
  originY: number;
}

function ConfettiParticle({ particle, progress, originY }: ParticleProps) {
  const {
    color,
    width,
    height,
    borderRadius,
    xSpread,
    yPop,
    yFall,
    peakProgress,
    rotation,
    wobbleFreq,
    wobbleAmp,
  } = particle;

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;

    // 1. Y Velocity: pop upward (-60 to -120), then accelerate downward with gravity (+300 to +500)
    let transY = 0;
    if (p < peakProgress) {
      const u = p / peakProgress;
      // Smooth deceleration to the apex
      const easeOut = 1 - (1 - u) * (1 - u);
      transY = yPop * easeOut;
    } else {
      const v = (p - peakProgress) / (1 - peakProgress);
      // Quadratic acceleration downward
      const gravityEase = v * v;
      transY = yPop + (yFall - yPop) * gravityEase;
    }

    // 2. X Spread: burst outward with air resistance + subtle paper flutter
    const lateralProgress = 1 - Math.pow(1 - p, 1.8);
    const flutter = Math.sin(p * Math.PI * wobbleFreq) * wobbleAmp;
    const transX = xSpread * lateralProgress + flutter;

    // 3. Rotation: spin between 0 and 720 degrees
    const rot = `${p * rotation}deg`;

    // 4. Opacity: starts at 1.0, fades to 0.0 over final 800ms (0.68 -> 1.0)
    let opacity = 1;
    if (p >= 0.68) {
      opacity = Math.max(0, 1 - (p - 0.68) / 0.32);
    }

    return {
      transform: [
        { translateX: transX },
        { translateY: transY },
        { rotate: rot },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particleBase,
        {
          top: originY,
          width,
          height,
          borderRadius,
          backgroundColor: color,
          marginLeft: -width / 2,
          marginTop: -height / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export interface ConfettiBurstProps {
  count?: number;
  duration?: number;
  originY?: number;
  style?: StyleProp<ViewStyle>;
  onAnimationEnd?: () => void;
}

export function ConfettiBurst({
  count = 40,
  duration = 2500,
  originY = 40,
  style,
  onAnimationEnd,
}: ConfettiBurstProps) {
  const [isActive, setIsActive] = useState(true);
  const progress = useSharedValue(0);

  // Generate 35-45 particles once on mount
  const particles = useMemo(() => generateParticles(count), [count]);

  useEffect(() => {
    let isMounted = true;

    const handleFinished = () => {
      if (isMounted) {
        setIsActive(false);
        onAnimationEnd?.();
      }
    };

    progress.value = withTiming(
      1,
      {
        duration,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(handleFinished)();
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [duration, onAnimationEnd]);

  // Clean unmount once animation completes (~2.5s)
  if (!isActive) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.container, style]}
    >
      {particles.map((p) => (
        <ConfettiParticle key={p.id} particle={p} progress={progress} originY={originY} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    pointerEvents: 'none',
    zIndex: 99,
  },
  particleBase: {
    position: 'absolute',
    left: '50%',
    top: 40,
  },
});
