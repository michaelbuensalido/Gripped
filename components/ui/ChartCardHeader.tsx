import React from 'react';
import { View, Text } from 'react-native';
import { Pointer } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

export interface ChartCardHeaderProps {
  title: string;
  subtitle?: string;
  /** Interaction affordance, e.g. "Tap a bar". Rendered as a quiet pill. */
  hint?: string;
  /** Replaces the hint slot (e.g. a legend). */
  trailing?: React.ReactNode;
}

/** Title block shared by every Plane-1 chart card inside the drill-down pages. */
export function ChartCardHeader({ title, subtitle, hint, trailing }: ChartCardHeaderProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: space.md,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.sectionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[type.caption, { color: colors.textWhiteMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing ??
        (hint ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.xs,
              paddingHorizontal: space.sm + 2,
              paddingVertical: space.xs,
              borderRadius: radius.pill,
              backgroundColor: colors.cardMuted,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Pointer size={space.md} color={colors.accentText} />
            <Text style={[type.captionMedium, { color: colors.accentText }]}>{hint}</Text>
          </View>
        ) : null)}
    </View>
  );
}
