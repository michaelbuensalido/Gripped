import React, { useEffect } from 'react';
import { TextInput, TextInputProps, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { useCelebrationStore } from '../../store/celebrationStore';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCounterProps extends Omit<TextInputProps, 'value'> {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  style, 
  className, 
  ...rest 
}: AnimatedCounterProps) {
  const sv = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const celebrationsEnabled = useCelebrationStore((state) => state.celebrationsEnabled);

  useEffect(() => {
    if (reducedMotion || !celebrationsEnabled) {
      sv.value = value;
    } else {
      sv.value = withTiming(value, { duration });
    }
  }, [value, duration, reducedMotion, celebrationsEnabled, sv]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: Math.round(sv.value).toString(),
      defaultValue: Math.round(sv.value).toString(),
    } as any;
  });

  // If animations are off, return a regular Text component to guarantee visibility and style inheritance.
  if (reducedMotion || !celebrationsEnabled) {
    return (
      <Text style={style} className={className}>
        {value.toString()}
      </Text>
    );
  }

  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      editable={false}
      style={style}
      className={className}
      defaultValue={value.toString()}
      value={value.toString()}
      {...rest}
    />
  );
}
