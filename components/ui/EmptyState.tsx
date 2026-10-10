import React from 'react';
import { View, Text, Image, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  /** Optional local illustration — pass require('./path/to/image.png') */
  illustration?: ImageSourcePropType;
  title: string;
  body: string;
  cta?: React.ReactNode;
  asCard?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  illustration,
  title,
  body,
  cta,
  asCard = false,
  style,
}: EmptyStateProps) {
  const { colors, type, space, radius, shadow } = useTheme();
  const reduceMotion = useReducedMotion();

  const cardStyle: ViewStyle = asCard
    ? {
        backgroundColor: colors.materialBase,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: space.xl,
        marginVertical: space.md,
        ...shadow.card,
      }
    : {
        padding: space.xl,
        flex: 1,
      };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(220).springify().damping(18)}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardStyle,
        style,
      ]}
    >
      {illustration ? (
        <Image
          source={illustration}
          style={{ width: 160, height: 120, borderRadius: radius.xl, marginBottom: space.md }}
          resizeMode="contain"
          accessible={false}
          aria-hidden
        />
      ) : icon ? (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.cardMuted,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.md,
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text
        style={[
          type.heading,
          {
            color: colors.text,
            marginBottom: space.xs,
            textAlign: 'center',
            fontWeight: '700',
            fontSize: 17,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          type.body,
          {
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: cta ? space.lg : 0,
            maxWidth: 280,
            lineHeight: 20,
            fontSize: 14,
          },
        ]}
      >
        {body}
      </Text>
      {cta && <View style={{ width: '100%', maxWidth: 280, marginTop: space.sm }}>{cta}</View>}
    </Animated.View>
  );
}
