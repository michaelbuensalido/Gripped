import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Trash2, Zap } from 'lucide-react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import Reanimated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withDelay, useReducedMotion } from 'react-native-reanimated';
import { GradePill } from './GradePill';
import { ResultChip, ResultType } from './ResultChip';
import { ScalePressable } from './ScalePressable';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
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

export const ClimbRow = React.memo(function ClimbRow({ climb, onEdit, onDelete, animateEntry, isNewFlash }: ClimbRowProps) {
  const { colors, space, type, radius, gradeBand } = useTheme();
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
          2, // shimmer twice
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

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
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
          borderRadius: radius.md,
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
          <Trash2 size={24} color={colors.textOnAccent} />
        </Animated.View>
      </RectButton>
    );
  };

  const stripeColor = gradeBand(climb.grade_index ?? 0).solid;
  const failureLabel = climb.failure_reason
    ? String(climb.failure_reason).replace(/_/g, ' ')
    : null;
  const hasSecondaryLine = Boolean(climb.projectTitle || climb.notes || failureLabel);

  const content = (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      <ScalePressable
        onPress={() => onEdit(climb)}
        haptic="light"
        activeScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Edit climb ${climb.grade_raw} ${climb.result}`}
        style={{
          backgroundColor: colors.materialBase,
          borderRadius: radius.lg,
          borderWidth: 0,
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: space.md + 8,
          paddingRight: space.md,
          paddingVertical: space.sm,
          gap: space.md,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Grade-band left stripe */}
        <View style={{
          position: 'absolute',
          left: 0,
          top: 14,
          bottom: 14,
          width: 4,
          borderRadius: 2,
          backgroundColor: stripeColor,
        }} />

        {isNewFlash && (
          <Reanimated.View style={[{
            position: 'absolute',
            width: 80,
            backgroundColor: '#FFFFFF',
            transform: [{ skewX: '-20deg' }],
            zIndex: 10,
          }, shimmerStyle]} pointerEvents="none" />
        )}

        <Text style={[type.display, { color: colors.textWhitePrimary, fontSize: 20, minWidth: 40 }]}>
          {climb.grade_raw}
        </Text>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: hasSecondaryLine ? 2 : 0 }}>
            {climb.result === 'flash' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.flash, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill }}>
                <Zap size={11} color="#000000" strokeWidth={2.5} style={{ marginRight: 3 }} />
                <Text style={[type.caption, { color: '#000000', fontWeight: '800' }]}>FLASH</Text>
              </View>
            ) : (
              <ResultChip result={(climb.result as ResultType) || 'attempt'} />
            )}
            {climb.attempts > 1 && (
              <Text style={[type.caption, { color: colors.textWhiteMuted }]}>×{climb.attempts}</Text>
            )}
            {failureLabel && (
              <View
                style={{
                  backgroundColor: colors.attemptSoft,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: radius.sm,
                }}
              >
                <Text
                  style={[
                    type.caption,
                    { color: colors.attemptText, fontSize: 10, textTransform: 'capitalize', fontWeight: '600' },
                  ]}
                >
                  {failureLabel}
                </Text>
              </View>
            )}
            <Text style={[type.caption, { color: colors.textWhiteMuted, marginLeft: 'auto' }]}>
              {climb.logged_at ? formatTime(climb.logged_at) : ''}
            </Text>
          </View>
          {climb.projectTitle ? (
            <Text style={[type.caption, { color: colors.accentText, marginTop: 2, fontWeight: '600' }]} numberOfLines={1}>
              {climb.projectTitle}
              {climb.notes ? ` · ${climb.notes}` : ''}
            </Text>
          ) : climb.notes ? (
            <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
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
