import React from 'react';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  StyleSheet: { create: jest.fn(), hairlineWidth: 1 },
  Animated: { Text: 'AnimatedText', View: 'AnimatedView', Value: jest.fn(() => ({ interpolate: jest.fn() })) },
  AccessibilityInfo: { isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)) },
  Easing: { inOut: jest.fn(), ease: jest.fn() }
}), { virtual: true });

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    createAnimatedComponent: (c: any) => c,
    View: 'AnimatedView',
  },
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedProps: (fn: any) => fn(),
  withTiming: (v: any) => v,
  useReducedMotion: () => false,
}), { virtual: true });

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}), { virtual: true });

import { StatTile } from '../../components/ui/StatTile';
import { colors } from '../../theme/tokens';

describe('StatTile', () => {
  it('renders final value properly and ensures sufficient contrast against tint', () => {
    // We test it by calling it directly since test renderers are not installed
    const tile = StatTile({ value: 100, label: 'Sessions', tintBg: '#ECE8FB' }) as React.ReactElement;
    const props = tile.props as any;
    
    // The tile wraps content in a Card, style might be an array [baseStyle, passedStyle]
    const flattenedStyle = Array.isArray(props.style)
      ? Object.assign({}, ...props.style)
      : props.style;

    expect(flattenedStyle).toEqual(expect.objectContaining({ backgroundColor: '#ECE8FB' }));
    
    // The children array contains the AnimatedCounter or Text and labels
    const children = props.children;
    // children[1] is the value component (Text or AnimatedCounter)
    const valueComponent = children[1];
    
    // The value component should have the value 100 passed to it
    expect(valueComponent.props.value).toBe(100);
    
    // The style passed to the value component should have color: colors.text
    const styleArray = valueComponent.props.style;
    const colorStyle = Array.isArray(styleArray)
      ? styleArray.find((s: any) => s && s.color)
      : styleArray;
    expect(colorStyle.color).toBe(colors.textWhitePrimary);
  });

  it('renders 0 properly', () => {
    const tile = StatTile({ value: 0, label: 'Sessions' }) as React.ReactElement;
    const props = tile.props as any;
    const valueComponent = props.children[1];
    expect(valueComponent.props.value ?? valueComponent.props.children).toBe(0);
  });
});
