import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useReducedMotion,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1); // iOS sheet curve
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

const ENTER_SPRING = { duration: 380, dampingRatio: 1, overshootClamping: true } as const;
const EXIT_MS = 240;
const BACKDROP_IN_MS = 200;
const BACKDROP_OUT_MS = 200;

/**
 * Shared motion for modal bottom sheets (LogSheet, StartSessionSheet).
 *
 * - Sheet starts a full screen-height off-screen, so tall sheets never "pop in" half visible.
 * - Entrance waits two frames after the Modal mounts so the heavy first render isn't
 *   competing with the animation (this was the main source of the stutter).
 * - Critically damped, overshoot-clamped spring in; no bounce that exposes a gap under the sheet.
 * - Exit uses an ease-out curve (never ease-in) and runs `after` only once the sheet is gone,
 *   so DB writes / navigation / celebrations never stall the slide-out.
 * - Drag-to-dismiss hands the finger's velocity to the spring.
 */
export function useSheetMotion(visible: boolean, onClosed: () => void) {
  const { height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const [isRendered, setIsRendered] = useState(visible);
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);
  const isClosing = useRef(false);
  const afterRef = useRef<(() => void) | null>(null);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const notifyParent = useRef(true);

  const finishClose = useCallback(() => {
    setIsRendered(false);
    const after = afterRef.current;
    afterRef.current = null;
    if (notifyParent.current) onClosedRef.current();
    after?.();
  }, []);

  /** Animate out, then unmount, notify the parent and run `after`. Safe to call repeatedly. */
  const close = useCallback(
    (after?: () => void, opts?: { notifyParent?: boolean }) => {
      if (after) afterRef.current = after;
      notifyParent.current = opts?.notifyParent ?? true;
      if (isClosing.current) return;
      isClosing.current = true;

      if (reduceMotion) {
        backdropOpacity.value = withTiming(0, { duration: 120 });
        translateY.value = withTiming(screenHeight, { duration: 120 }, (finished) => {
          if (finished) runOnJS(finishClose)();
        });
        return;
      }

      backdropOpacity.value = withTiming(0, { duration: BACKDROP_OUT_MS, easing: EASE_OUT });
      translateY.value = withTiming(screenHeight, { duration: EXIT_MS, easing: EASE_SHEET }, (finished) => {
        if (finished) runOnJS(finishClose)();
      });
    },
    [reduceMotion, screenHeight, finishClose, backdropOpacity, translateY]
  );

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      notifyParent.current = true;
      setIsRendered(true);

      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (reduceMotion) {
            backdropOpacity.value = withTiming(1, { duration: 120 });
            translateY.value = withTiming(0, { duration: 120 });
            return;
          }
          backdropOpacity.value = withTiming(1, { duration: BACKDROP_IN_MS, easing: EASE_OUT });
          translateY.value = withSpring(0, ENTER_SPRING);
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }

    if (isRendered && !isClosing.current) {
      // Parent hid the sheet (e.g. after save): slide out without re-notifying more than once.
      close(undefined, { notifyParent: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = e.translationY * 0.18; // rubber-band upward
      } else {
        translateY.value = e.translationY;
        backdropOpacity.value = interpolate(
          e.translationY,
          [0, 320],
          [1, 0.2],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 650) {
        isClosing.current = true;
        notifyParent.current = true;
        backdropOpacity.value = withTiming(0, { duration: BACKDROP_OUT_MS, easing: EASE_OUT });
        translateY.value = withSpring(
          screenHeight,
          { velocity: e.velocityY, duration: 320, dampingRatio: 1, overshootClamping: true },
          (finished) => {
            if (finished) runOnJS(finishClose)();
          }
        );
      } else {
        backdropOpacity.value = withTiming(1, { duration: 150, easing: EASE_OUT });
        translateY.value = withSpring(0, {
          velocity: e.velocityY,
          duration: 320,
          dampingRatio: 0.8,
          overshootClamping: true,
        });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return { isRendered, backdropStyle, sheetStyle, panGesture, close };
}
