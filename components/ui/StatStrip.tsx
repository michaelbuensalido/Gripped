import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export interface StatStripCell {
  label: string;
  value: string | number;
  /** Overrides the value colour (e.g. `colors.flashText`). */
  valueColor?: string;
  /** Overrides the label colour. */
  labelColor?: string;
}

export interface StatStripProps {
  cells: StatStripCell[];
}

/**
 * Recessed telemetry strip (`surfaceInset`) with hairline dividers.
 * Value-first: Sora numerals on top, sentence-case caption beneath. Max 4 cells.
 */
export function StatStrip({ cells }: StatStripProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceInset,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: space.md,
      }}
    >
      {cells.map((cell, idx) => (
        <React.Fragment key={cell.label}>
          {idx > 0 && <View style={{ width: 1, backgroundColor: colors.divider }} />}
          <View style={{ flex: 1, alignItems: 'center', gap: space.xs, paddingHorizontal: space.xs }}>
            <Text
              style={[type.statBold, { color: cell.valueColor ?? colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {cell.value}
            </Text>
            <Text
              style={[type.captionMedium, { color: cell.labelColor ?? colors.textWhiteMuted }]}
              numberOfLines={1}
            >
              {cell.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
