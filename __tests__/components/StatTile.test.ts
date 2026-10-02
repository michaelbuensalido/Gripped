import React from 'react';
import { StatTile } from '../../components/ui/StatTile';

describe('StatTile', () => {
  it('renders final value properly and ensures sufficient contrast against tint', () => {
    // We test it by calling it directly since test renderers are not installed
    const tile = StatTile({ value: 100, label: 'Sessions', tintBg: '#ECE8FB' }) as React.ReactElement;
    const props = tile.props as any;
    
    // The tile wraps content in a Card
    expect(props.style).toEqual(expect.objectContaining({ backgroundColor: '#ECE8FB' }));
    
    // The children array contains the AnimatedCounter or Text and labels
    const children = props.children;
    // children[1] is the value component (Text or AnimatedCounter)
    const valueComponent = children[1];
    
    // The value component should have the value 100 passed to it
    expect(valueComponent.props.value).toBe(100);
    // Or if it's Text, the children is 100
    
    // The style passed to the value component should have color: colors.text (#1C1B22)
    // which has a high contrast with #ECE8FB
    const styleArray = valueComponent.props.style;
    const colorStyle = styleArray.find((s: any) => s && s.color);
    expect(colorStyle.color).toBe('#1C1B22');
  });

  it('renders 0 properly', () => {
    const tile = StatTile({ value: 0, label: 'Sessions' }) as React.ReactElement;
    const props = tile.props as any;
    const valueComponent = props.children[1];
    expect(valueComponent.props.value ?? valueComponent.props.children).toBe(0);
  });
});
