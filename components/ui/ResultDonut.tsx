import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { GlowBackdrop } from './GlowBackdrop';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const OUTER_RADIUS = 96;
const INNER_RADIUS = 76;
const STROKE_WIDTH = OUTER_RADIUS - INNER_RADIUS; // 20pt
const RING_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2; // 86pt
const RING_SIZE = OUTER_RADIUS * 2; // 192pt
const CENTER = OUTER_RADIUS; // 96pt
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Strong custom curves per animate-expo
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

const ENTER_DURATION = 280;
const MORPH_DURATION = 240;
const LABEL_DURATION = 180;

export interface ResultDonutProps {
  flashCount: number;
  topCount: number;
  attemptCount: number;
  failCount?: number;
  centerGrade?: string;
  centerLabel?: string;
}

interface RingSegmentProps {
  color: string;
  startSv: SharedValue<number>;
  fracSv: SharedValue<number>;
}

function RingSegment({ color, startSv, fracSv }: RingSegmentProps) {
  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-90 + startSv.get() * 360}deg` }],
  }));

  const circleProps = useAnimatedProps(() => {
    const clamped = Math.max(0, Math.min(1, fracSv.get()));
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - clamped),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: RING_SIZE,
          height: RING_SIZE,
          top: 0,
          left: 0,
        },
        rotationStyle,
      ]}
    >
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeLinecap="butt"
          animatedProps={circleProps}
        />
      </Svg>
    </Animated.View>
  );
}

export function ResultDonut({
  flashCount,
  topCount,
  attemptCount,
  failCount = 0,
  centerGrade = '–',
  centerLabel = 'Average of last 20 routes',
}: ResultDonutProps) {
  const { colors, type } = useTheme();
  const reducedMotion = useReducedMotion();
  const hasMountedRef = useRef(false);

  const total = flashCount + topCount + attemptCount + failCount;
  const isEmpty = total === 0;

  // Target fractions [0..1]
  const fFlash = isEmpty ? 0 : flashCount / total;
  const fTop = isEmpty ? 0 : topCount / total;
  const fAttempt = isEmpty ? 0 : attemptCount / total;
  const fFail = isEmpty ? 0 : failCount / total;

  // Target start offsets [0..1]
  const sFlash = 0;
  const sTop = fFlash;
  const sAttempt = fFlash + fTop;
  const sFail = fFlash + fTop + fAttempt;

  // Shared values for segment starts and fractions
  const start0 = useSharedValue(reducedMotion ? sFlash : 0);
  const start1 = useSharedValue(reducedMotion ? sTop : 0);
  const start2 = useSharedValue(reducedMotion ? sAttempt : 0);
  const start3 = useSharedValue(reducedMotion ? sFail : 0);

  const frac0 = useSharedValue(reducedMotion ? fFlash : 0);
  const frac1 = useSharedValue(reducedMotion ? fTop : 0);
  const frac2 = useSharedValue(reducedMotion ? fAttempt : 0);
  const frac3 = useSharedValue(reducedMotion ? fFail : 0);

  // Center readout subtle transition on data change (never from scale 0)
  const centerScale = useSharedValue(reducedMotion ? 1 : 0.95);
  const centerOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    const isInitial = !hasMountedRef.current;
    hasMountedRef.current = true;

    if (reducedMotion) {
      start0.set(sFlash);
      start1.set(sTop);
      start2.set(sAttempt);
      start3.set(sFail);
      frac0.set(fFlash);
      frac1.set(fTop);
      frac2.set(fAttempt);
      frac3.set(fFail);
      centerScale.set(1);
      centerOpacity.set(1);
      return;
    }

    const timingConfig = {
      duration: isInitial ? ENTER_DURATION : MORPH_DURATION,
      easing: isInitial ? EASE_OUT : EASE_IN_OUT,
      reduceMotion: ReduceMotion.System,
    };

    start0.set(withTiming(sFlash, timingConfig));
    start1.set(withTiming(sTop, timingConfig));
    start2.set(withTiming(sAttempt, timingConfig));
    start3.set(withTiming(sFail, timingConfig));

    frac0.set(withTiming(fFlash, timingConfig));
    frac1.set(withTiming(fTop, timingConfig));
    frac2.set(withTiming(fAttempt, timingConfig));
    frac3.set(withTiming(fFail, timingConfig));

    if (!isInitial) {
      centerScale.set(0.96);
      centerOpacity.set(0.65);
    }
    centerScale.set(
      withTiming(1, {
        duration: LABEL_DURATION,
        easing: EASE_OUT,
        reduceMotion: ReduceMotion.System,
      })
    );
    centerOpacity.set(
      withTiming(1, {
        duration: LABEL_DURATION,
        easing: EASE_OUT,
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [
    sFlash,
    sTop,
    sAttempt,
    sFail,
    fFlash,
    fTop,
    fAttempt,
    fFail,
    centerGrade,
    reducedMotion,
    start0,
    start1,
    start2,
    start3,
    frac0,
    frac1,
    frac2,
    frac3,
    centerScale,
    centerOpacity,
  ]);

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.get(),
    transform: [{ scale: centerScale.get() }],
  }));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        width: '100%',
        paddingVertical: 10,
      }}
    >
      {/* Donut Ring + Center Readout */}
      <View
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!isEmpty ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          >
            <GlowBackdrop spread={10} />
          </View>
        ) : null}

        {/* Base Track Ring */}
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke={colors.chartGhostStrong}
            strokeWidth={STROKE_WIDTH}
          />
        </Svg>

        {/* Animated Outcome Arcs (UI Runtime) */}
        <RingSegment color={colors.flash} startSv={start0} fracSv={frac0} />
        <RingSegment color={colors.top} startSv={start1} fracSv={frac1} />
        <RingSegment color={colors.attempt} startSv={start2} fracSv={frac2} />
        <RingSegment color={colors.fail} startSv={start3} fracSv={frac3} />

        {/* Center Grade & Caption */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 110,
            },
            centerAnimatedStyle,
          ]}
        >
          <Text
            style={{
              color: isEmpty ? colors.textWhiteMuted : colors.text,
              fontSize: 42,
              fontWeight: '500',
              fontFamily: type.display.fontFamily,
              lineHeight: 46,
            }}
          >
            {centerGrade}
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 10.5,
              textAlign: 'center',
              fontFamily: type.caption.fontFamily,
              lineHeight: 13,
              marginTop: 2,
            }}
          >
            {isEmpty ? 'Log climbs to fill the ring' : centerLabel}
          </Text>
        </Animated.View>
      </View>

      {/* Vertical Legend on Right */}
      <View style={{ gap: 14, justifyContent: 'center' }}>
        <LegendRow color={colors.flash} label="Flash" count={flashCount} />
        <LegendRow color={colors.top} label="Top" count={topCount} />
        <LegendRow color={colors.attempt} label="Attempt" count={attemptCount} />
        <LegendRow color={colors.fail} label="Fail" count={failCount} />
      </View>
    </View>
  );
}

function LegendRow({ color, label, count }: { color: string; label: string; count: number }) {
  const { type, colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
        }}
      />
      <Text
        style={{
          color: colors.textWhiteSecondary,
          fontSize: 14,
          fontWeight: '500',
          fontFamily: type.body.fontFamily,
          minWidth: 58,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          fontFamily: type.body.fontFamily,
          fontVariant: ['tabular-nums'],
        }}
      >
        {count}
      </Text>
    </View>
  );
}
