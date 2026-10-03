import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Reanimated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { GradePill } from './GradePill';
import { ResultChip, ResultType } from './ResultChip';
import { useTheme } from '../../theme/useTheme';
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

export function ClimbRow({ climb, onEdit, onDelete, animateEntry, isNewFlash }: ClimbRowProps) {
  const { colors, space, type, radius, gradeBand } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const shimmerProgress = useSharedValue(-1);

  useEffect(() => {
    if (isNewFlash) {
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
  }, [isNewFlash]);

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
      <TouchableOpacity
        style={{
          width: 80,
          backgroundColor: colors.danger,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.md,
          marginLeft: space.sm,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(climb.id);
        }}
        accessibilityRole="button"
        accessibilityLabel="Delete climb"
      >
        <Animated.View style={{ opacity }}>
          <Trash2 size={24} color={colors.textOnAccent} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const stripeColor = gradeBand(climb.grade_index ?? 0).solid;

  const content = (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onEdit(climb)}
        accessibilityRole="button"
        accessibilityLabel={`Edit climb ${climb.grade_raw} ${climb.result}`}
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
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

        <GradePill gradeIndex={climb.grade_index ?? 0} label={climb.grade_raw} />
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: climb.projectTitle ? 2 : 0 }}>
            <ResultChip result={(climb.result as ResultType) || 'attempt'} />
            {climb.attempts > 1 && (
              <Text style={[type.caption, { color: colors.textMuted }]}>×{climb.attempts}</Text>
            )}
            <Text style={[type.caption, { color: colors.textMuted, marginLeft: 'auto' }]}>
              {climb.logged_at ? formatTime(climb.logged_at) : ''}
            </Text>
          </View>
          {climb.projectTitle && (
            <Text style={[type.caption, { color: colors.text, marginTop: 4 }]} numberOfLines={1}>
              {climb.projectTitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <Reanimated.View
      layout={listLayout}
      entering={animateEntry ? FadeInDown.duration(400).springify() : undefined}
    >
      {content}
    </Reanimated.View>
  );
}
