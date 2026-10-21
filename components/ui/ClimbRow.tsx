import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { Trash2, Zap, Target } from 'lucide-react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import Reanimated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import { ResultChip, ResultType } from './ResultChip';
import { ScalePressable } from './ScalePressable';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { usePreferences } from '../../utils/preferences';
import { listLayout } from '../../theme/layout';

export interface ClimbRowProps {
  climb: any;
  onEdit: (climb: any) => void;
  onDelete: (id: string) => void;
  animateEntry?: boolean;
  isNewFlash?: boolean;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

export const ClimbRow = React.memo(function ClimbRow({
  climb,
  onEdit,
  onDelete,
  animateEntry,
  isNewFlash,
}: ClimbRowProps) {
  const { colors, space, type, radius, gradeBand } = useTheme();
  const { formatGrade } = usePreferences();
  const swipeableRef = useRef<Swipeable>(null);
  const reduceMotion = useReducedMotion();
  const shimmerProgress = useSharedValue(-1);

  useEffect(() => {
    if (isNewFlash && !reduceMotion) {
      shimmerProgress.value = -0.5;
      shimmerProgress.value = withDelay(
        400,
        withRepeat(
          withTiming(1.5, { duration: 1200, easing: Easing.linear }),
          2,
          false
        )
      );
    }
  }, [isNewFlash, reduceMotion]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      left: `${shimmerProgress.value * 100}%`,
      opacity: shimmerProgress.value > -0.5 && shimmerProgress.value < 1.5 ? 0.3 : 0,
    };
  });

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <RectButton
        testID="delete-climb-btn"
        style={{
          width: 80,
          backgroundColor: colors.danger,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.lg,
          marginLeft: space.sm,
        }}
        onPress={() => {
          triggerHaptic('heavy');
          swipeableRef.current?.close();
          onDelete(climb.id);
        }}
        accessibilityRole="button"
        accessibilityLabel="Delete climb"
      >
        <Animated.View style={{ opacity }}>
          <Trash2 size={22} color={colors.textOnAccent} />
        </Animated.View>
      </RectButton>
    );
  };

  const band = gradeBand(climb.grade_index ?? 0);
  const stripeColor = band.solid;
  const formattedGrade = formatGrade(climb.grade_index, climb.grade_raw);
  const failureLabel = climb.failure_reason
    ? String(climb.failure_reason).replace(/_/g, ' ')
    : null;
  const styleBadge = [climb.wall_angle, climb.hold_type]
    .filter(Boolean)
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' · ');
  const hasSecondaryLine = Boolean(climb.projectTitle || climb.notes);

  const content = (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      <ScalePressable
        onPress={() => onEdit(climb)}
        haptic="light"
        activeScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Edit climb ${formattedGrade} ${climb.result}`}
        style={{
          backgroundColor: colors.materialBase,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: 62,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: space.md + 6,
          paddingRight: space.md,
          paddingVertical: 10,
          gap: space.md,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Grade-band left accent bar */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 12,
            bottom: 12,
            width: 4,
            borderRadius: 2,
            backgroundColor: stripeColor,
          }}
        />

        {isNewFlash && (
          <Reanimated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 80,
                backgroundColor: colors.textWhitePrimary,
                transform: [{ skewX: '-20deg' }],
                zIndex: 10,
              },
              shimmerStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {/* Sculpted Grade Badge Tile */}
        <View
          style={{
            minWidth: 46,
            height: 38,
            paddingHorizontal: 8,
            borderRadius: radius.sm,
            backgroundColor: band.bg,
            borderWidth: 1,
            borderColor: band.solid + '44',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={[
              type.statSm,
              {
                color: band.text,
                fontSize: 16,
                lineHeight: 20,
                fontWeight: '700',
              },
            ]}
          >
            {formattedGrade}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.xs,
              marginBottom: hasSecondaryLine ? 3 : 0,
            }}
          >
            {climb.result === 'flash' ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.flash,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                }}
              >
                <Zap
                  size={11}
                  color={colors.bgTexture}
                  strokeWidth={2.5}
                  style={{ marginRight: 3 }}
                />
                <Text style={[type.caption, { color: colors.bgTexture, fontWeight: '800', fontSize: 11 }]}>
                  FLASH
                </Text>
              </View>
            ) : (
              <ResultChip result={(climb.result as ResultType) || 'attempt'} />
            )}

            {climb.attempts > 1 && (
              <View
                style={{
                  backgroundColor: colors.cardMuted,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={[type.caption, { color: colors.textWhiteSecondary, fontSize: 11, fontWeight: '600' }]}>
                  ×{climb.attempts}
                </Text>
              </View>
            )}

            {styleBadge ? (
              <View
                style={{
                  backgroundColor: colors.cardMuted,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: radius.sm,
                }}
              >
                <Text style={[type.caption, { color: colors.textMuted, fontSize: 10, fontWeight: '600' }]} numberOfLines={1}>
                  {styleBadge}
                </Text>
              </View>
            ) : null}

            {failureLabel && (
              <View
                style={{
                  backgroundColor: colors.attemptSoft,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: colors.attempt + '40',
                }}
              >
                <Text
                  style={[
                    type.caption,
                    {
                      color: colors.attemptText,
                      fontSize: 10,
                      textTransform: 'capitalize',
                      fontWeight: '600',
                    },
                  ]}
                >
                  {failureLabel}
                </Text>
              </View>
            )}

            <Text
              style={[
                type.caption,
                { color: colors.textWhiteMuted, marginLeft: 'auto', fontSize: 11 },
              ]}
            >
              {climb.logged_at ? formatTime(climb.logged_at) : ''}
            </Text>
          </View>

          {climb.projectTitle ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Target size={11} color={colors.accentText} />
              <Text
                style={[
                  type.caption,
                  { color: colors.accentText, fontWeight: '600', flex: 1 },
                ]}
                numberOfLines={1}
              >
                {climb.projectTitle}
                {climb.notes ? ` · ${climb.notes}` : ''}
              </Text>
            </View>
          ) : climb.notes ? (
            <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
              {climb.notes}
            </Text>
          ) : null}
        </View>
      </ScalePressable>
    </Swipeable>
  );

  return (
    <Reanimated.View
      layout={listLayout}
      entering={animateEntry ? FadeIn.duration(200) : undefined}
    >
      {content}
    </Reanimated.View>
  );
});
ClimbRow.displayName = 'ClimbRow';
