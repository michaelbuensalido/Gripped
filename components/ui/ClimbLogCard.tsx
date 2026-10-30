import React from 'react';
import { View, Text } from 'react-native';
import { ChevronRight, MapPin, Target } from 'lucide-react-native';
import { GradePill } from './GradePill';
import { ResultChip, ResultType } from './ResultChip';
import { ScalePressable } from './ScalePressable';
import { useTheme } from '../../theme/useTheme';
import { usePreferences } from '../../utils/preferences';
import type { FilteredClimbItem } from '../../db/queries';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatClimbDate(ms: number): string {
  const d = new Date(ms);
  return `${SHORT_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatStyleLabel(wallAngle: string | null, holdType: string | null): string | null {
  const parts = [wallAngle, holdType]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((s) => s.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()));
  return parts.length > 0 ? parts.join(' · ') : null;
}

export interface ClimbLogCardProps {
  climb: FilteredClimbItem;
  onPress?: (climb: FilteredClimbItem) => void;
  highlightPeak?: boolean;
}

export const ClimbLogCard = React.memo(function ClimbLogCard({
  climb,
  onPress,
  highlightPeak = false,
}: ClimbLogCardProps) {
  const { colors, type, space, radius, gradeBand } = useTheme();
  const { formatGrade } = usePreferences();

  const band = gradeBand(climb.gradeIndex);
  const mappedResult: ResultType =
    climb.result === 'flash'
      ? 'flash'
      : climb.result === 'send' || climb.result === 'top'
      ? 'top'
      : 'attempt';

  const gradeText = formatGrade(climb.gradeIndex, climb.gradeRaw);
  const dateText = formatClimbDate(climb.loggedAt);
  const styleText = formatStyleLabel(climb.wallAngle, climb.holdType);
  const failureText = climb.failureReason
    ? climb.failureReason.replace(/_/g, ' ')
    : null;

  return (
    <ScalePressable
      haptic="light"
      activeScale={0.98}
      disabled={!onPress}
      onPress={() => onPress?.(climb)}
      accessibilityRole="button"
      accessibilityLabel={`${gradeText} ${mappedResult} at ${climb.gymName} on ${dateText}`}
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: highlightPeak ? band.solid : colors.border,
        paddingVertical: space.md,
        paddingLeft: space.lg,
        paddingRight: space.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Signature 4pt vertical grade-band stripe */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: space.md,
          bottom: space.md,
          width: space.xs,
          borderRadius: radius.pill,
          backgroundColor: band.solid,
        }}
      />

      <GradePill gradeIndex={climb.gradeIndex} label={climb.gradeRaw} />

      <View style={{ flex: 1, gap: space.xs }}>
        {/* Primary outcome & style row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: space.sm,
          }}
        >
          <ResultChip result={mappedResult} />

          {climb.attempts > 1 && (
            <Text style={[type.captionSemibold, { color: colors.textMuted }]}>
              {`×${climb.attempts}`}
            </Text>
          )}

          {highlightPeak && (
            <Text style={[type.captionSemibold, { color: band.text }]}>
              Peak
            </Text>
          )}

          {styleText && (
            <Text
              numberOfLines={1}
              style={[type.captionMedium, { color: colors.textMuted }]}
            >
              {styleText}
            </Text>
          )}
        </View>

        {/* Optional linked project title */}
        {climb.projectTitle ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
            <Target size={space.md} color={colors.accentText} />
            <Text
              numberOfLines={1}
              style={[type.captionSemibold, { color: colors.text, flex: 1 }]}
            >
              {climb.projectTitle}
            </Text>
          </View>
        ) : null}

        {/* Optional notes or failure reason */}
        {climb.notes ? (
          <Text
            numberOfLines={1}
            style={[type.caption, { color: colors.textWhiteSecondary }]}
          >
            {`“${climb.notes}”`}
          </Text>
        ) : failureText ? (
          <Text
            numberOfLines={1}
            style={[type.captionMedium, { color: colors.dangerText }]}
          >
            {`Crux · ${failureText}`}
          </Text>
        ) : null}

        {/* Session location + date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <MapPin size={space.md} color={colors.textWhiteMuted} />
          <Text
            numberOfLines={1}
            style={[type.caption, { color: colors.textMuted, flexShrink: 1 }]}
          >
            {climb.gymName}
          </Text>
          <Text style={[type.caption, { color: colors.textWhiteMuted }]}>·</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{dateText}</Text>
        </View>
      </View>

      {onPress && <ChevronRight size={space.lg} color={colors.textWhiteMuted} />}
    </ScalePressable>
  );
});
