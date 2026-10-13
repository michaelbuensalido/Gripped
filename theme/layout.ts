import { LinearTransition, Easing } from 'react-native-reanimated';
import { motion } from './tokens';

/**
 * Shared spring layout transition (v3.0 fluid physics).
 * Pass as `layout` to a Reanimated view, or as `itemLayoutAnimation` to Animated.FlatList,
 * so items slide into place when added, removed or expanded.
 */
export const listLayout = LinearTransition.duration(motion.duration.base).easing(
  Easing.bezier(0.23, 1, 0.32, 1)
);
