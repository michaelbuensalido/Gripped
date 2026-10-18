import React, { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import {
  shouldShowLaunchIntro,
  recordAppOpen,
} from "../../constants/launchConfig";

/**
 * Module-level in-memory flag.
 * Persists during app backgrounding and screen navigation so the intro
 * sequence ONLY runs once per cold start.
 */
let _hasPlayedLaunchIntroThisSession = false;

export function hasPlayedLaunchIntro(): boolean {
  return _hasPlayedLaunchIntroThisSession;
}

export function resetLaunchIntroForTesting(): void {
  _hasPlayedLaunchIntroThisSession = false;
}

export interface BrandedLaunchSequenceProps {
  /**
   * Callback fired once the intro sequence has completed or was skipped.
   */
  onFinish?: () => void;
  /**
   * Optional prop to bypass storage gap check (useful in test environments).
   */
  forcePlay?: boolean;
}

/**
 * Strong custom cubic bezier easing curve (Emil Kowalski / animate-expo).
 */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Animation Timings (Total sequence: ~860ms <= 1.2s budget)
 * - Entrance: 280ms subtle scale-in (0.94 -> 1.0) and opacity (0.7 -> 1.0)
 * - Hold: 320ms hold (pause for recognition without delaying interaction)
 * - Exit: 260ms fade out to reveal Home/Welcome
 */
const TIMINGS = {
  ENTER_DURATION: 280,
  OPACITY_DURATION: 240,
  HOLD_DELAY: 600,
  EXIT_DURATION: 260,
  REDUCED_HOLD: 250,
  REDUCED_EXIT: 200,
};

export function BrandedLaunchSequence({
  onFinish,
  forcePlay = false,
}: BrandedLaunchSequenceProps) {
  const reduceMotion = useReducedMotion();
  const [isDone, setIsDone] = useState(_hasPlayedLaunchIntroThisSession && !forcePlay);
  const [isReadyToAnimate, setIsReadyToAnimate] = useState(false);

  const containerOpacity = useSharedValue(1);
  const iconScale = useSharedValue(reduceMotion ? 1 : 0.94);
  const iconOpacity = useSharedValue(reduceMotion ? 1 : 0.7);

  const finishedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsDone(true);
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    // If already played during this cold-start session, skip immediately
    if (_hasPlayedLaunchIntroThisSession && !forcePlay) {
      handleComplete();
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const shouldShow = forcePlay || (await shouldShowLaunchIntro());
        if (!isMounted) return;

        if (!shouldShow) {
          _hasPlayedLaunchIntroThisSession = true;
          await recordAppOpen();
          handleComplete();
          return;
        }

        _hasPlayedLaunchIntroThisSession = true;
        await recordAppOpen();
        if (isMounted) {
          setIsReadyToAnimate(true);
        }
      } catch (e) {
        if (isMounted) {
          handleComplete();
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [forcePlay, handleComplete]);

  // Execute motion once ready
  useEffect(() => {
    if (!isReadyToAnimate || isDone) return;

    if (reduceMotion) {
      // Accessible reduced motion: skip scaling and perform a plain fade
      containerOpacity.value = withDelay(
        TIMINGS.REDUCED_HOLD,
        withTiming(
          0,
          { duration: TIMINGS.REDUCED_EXIT, easing: EASE_OUT },
          (finished) => {
            if (finished) {
              runOnJS(handleComplete)();
            }
          }
        )
      );
    } else {
      // Emil Kowalski motion: subtle scale-in from 0.94 -> 1.0, brief hold, then fade out
      iconScale.value = withTiming(1, {
        duration: TIMINGS.ENTER_DURATION,
        easing: EASE_OUT,
      });

      iconOpacity.value = withTiming(1, {
        duration: TIMINGS.OPACITY_DURATION,
        easing: EASE_OUT,
      });

      containerOpacity.value = withDelay(
        TIMINGS.HOLD_DELAY,
        withTiming(
          0,
          { duration: TIMINGS.EXIT_DURATION, easing: EASE_OUT },
          (finished) => {
            if (finished) {
              runOnJS(handleComplete)();
            }
          }
        )
      );
    }
  }, [isReadyToAnimate, isDone, reduceMotion, containerOpacity, iconScale, iconOpacity, handleComplete]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  if (isDone) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={isDone ? "none" : "auto"}
      style={[styles.container, containerAnimatedStyle]}
      accessibilityRole="none"
      accessible={false}
    >
      <StatusBar style="light" />
      <Animated.Image
        source={require("../../assets/logo.png")}
        style={[styles.logo, iconAnimatedStyle]}
        resizeMode="contain"
        accessibilityLabel="Gripped Logo"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#0B0B0F",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    elevation: 999999,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 32,
  },
});
