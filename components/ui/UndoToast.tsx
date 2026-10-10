import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { RotateCcw } from 'lucide-react-native';
import { ScalePressable } from './ScalePressable';

export function UndoToast({
  visible,
  onUndo,
  onDismiss,
  message = "Climb deleted",
}: {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  message?: string;
}) {
  const { colors, type, radius, shadow, motion } = useTheme();
  const reduceMotion = useReducedMotion();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(0.95);
  const [mounted, setMounted] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) {
        opacity.value = 1;
        translateY.value = 0;
        scale.value = 1;
      } else {
        opacity.value = withTiming(1, {
          duration: motion.duration.fast,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        });
        translateY.value = withSpring(0, {
          damping: motion.spring.damping,
          stiffness: motion.spring.stiffness,
        });
        scale.value = withSpring(1, {
          damping: motion.spring.damping,
          stiffness: motion.spring.stiffness,
        });
      }

      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    } else if (mounted) {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    if (reduceMotion) {
      opacity.value = 0;
      setMounted(false);
      onDismiss();
      return;
    }

    opacity.value = withTiming(0, {
      duration: motion.duration.fast,
      easing: Easing.in(Easing.cubic),
    });
    translateY.value = withTiming(16, { duration: motion.duration.fast }, (finished) => {
      if (finished) {
        runOnJS(setMounted)(false);
        runOnJS(onDismiss)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ] as any,
  }));

  if (!mounted && !visible) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        shadow.floating,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
        animatedStyle,
      ]}
    >
      <Text style={[type.body, { color: colors.text }]}>{message}</Text>
      <ScalePressable
        testID="undo-toast-btn"
        onPress={() => {
          onUndo();
          handleDismiss();
        }}
        haptic="medium"
        activeScale={0.94}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.btn}
      >
        <RotateCcw size={16} color={colors.accent} style={{ marginRight: 6 }} />
        <Text style={[type.heading, { color: colors.accentText, fontSize: 14, fontWeight: '700' }]}>
          UNDO
        </Text>
      </ScalePressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    zIndex: 1000,
    minHeight: 48,
  },
  btn: {
    marginLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
});
