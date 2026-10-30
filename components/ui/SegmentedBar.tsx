import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export interface SegmentedBarSegment {
  value: number;
  color: string;
}

export interface SegmentedBarProps {
  segments: SegmentedBarSegment[];
  /** Track height. Defaults to `space.sm`. */
  height?: number;
}

/**
 * Proportional outcome / band bar. Each segment is its own rounded capsule separated by
 * a hairline gap on a `chartGhost` track, so splits stay legible even at tiny proportions.
 */
export function SegmentedBar({ segments, height }: SegmentedBarProps) {
  const { colors, space, radius } = useTheme();
  const visible = segments.filter((s) => s.value > 0);

  return (
    <View
      style={{
        height: height ?? space.sm,
        borderRadius: radius.pill,
        backgroundColor: colors.chartGhost,
        flexDirection: 'row',
        gap: space.xs / 2,
        overflow: 'hidden',
      }}
    >
      {visible.map((s, idx) => (
        <View
          key={idx}
          style={{
            flex: s.value,
            backgroundColor: s.color,
            borderRadius: radius.pill,
          }}
        />
      ))}
    </View>
  );
}

export interface BarLegendItem {
  label: string;
  /** Omit for a pure colour key (no count). */
  value?: number | string;
  color: string;
}

/** Legend row for `SegmentedBar`: dot · bold count · muted label. */
export function BarLegend({ items }: { items: BarLegendItem[] }) {
  const { colors, type, space, radius } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.sm,
      }}
    >
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 }}>
          <View
            style={{
              width: space.sm,
              height: space.sm,
              borderRadius: radius.pill,
              backgroundColor: item.color,
            }}
          />
          {item.value !== undefined && (
            <Text style={[type.captionSemibold, { color: colors.text }]}>{item.value}</Text>
          )}
          <Text style={[type.captionMedium, { color: colors.textMuted }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
