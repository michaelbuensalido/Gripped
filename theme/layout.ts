import { LinearTransition, FadeInDown, Easing } from 'react-native-reanimated';
import { motion } from './tokens';

/**
 * Shared spring layout transition (v3.0 fluid physics).
 * Pass as `layout` to a Reanimated view, or as `itemLayoutAnimation` to Animated.FlatList,
 * so items slide into place when added, removed or expanded.
 */
export const listLayout = LinearTransition.duration(motion.duration.base).easing(
  Easing.bezier(0.23, 1, 0.32, 1)
);

/**
 * Staggered section entrance for the Progress drill-down pages (v4.3).
 * Opacity + short translate only, runs on the UI thread, < 300ms total.
 * Pass `undefined` instead when `useReducedMotion()` is true.
 */
export const sectionEntering = (index: number) =>
  FadeInDown.duration(motion.duration.slow)
    .delay(index * 50)
    .easing(Easing.bezier(0.23, 1, 0.32, 1));
