import React from 'react';
import { View, Text } from 'react-native';
import { ScalePressable } from './ScalePressable';
import { useTheme } from '../../theme/useTheme';

export type ContextPillTone = 'accent' | 'positive' | 'neutral' | 'custom';

export interface ContextPillProps {
  label: string;
  icon?: React.ReactNode;
  /** Trailing icon, e.g. an `X` for dismissible filters. */
  trailingIcon?: React.ReactNode;
  tone?: ContextPillTone;
  /** Only used with `tone="custom"` (e.g. grade-band colours). */
  customColors?: { bg: string; fg: string; border: string };
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * Compact status / reset pill used in the top-right of drill-down hero cards.
 * Pressable when `onPress` is provided (>= 44pt effective hit area via hitSlop).
 */
export function ContextPill({
  label,
  icon,
  trailingIcon,
  tone = 'neutral',
  customColors,
  onPress,
  accessibilityLabel,
}: ContextPillProps) {
  const { colors, type, space, radius } = useTheme();

  const palette =
    tone === 'accent'
      ? { bg: colors.accentSoft, fg: colors.accentText, border: colors.accent }
      : tone === 'positive'
      ? { bg: colors.flashSoft, fg: colors.flashText, border: colors.flashSoft }
      : tone === 'custom' && customColors
      ? customColors
      : { bg: colors.surfaceInset, fg: colors.textMuted, border: colors.border };

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        minHeight: space.xl + space.xs,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      {icon}
      <Text style={[type.captionSemibold, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
      {trailingIcon}
    </View>
  );

  if (!onPress) return body;

  return (
    <ScalePressable
      haptic="selection"
      activeScale={0.96}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {body}
    </ScalePressable>
  );
}
