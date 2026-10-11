import React from 'react';
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import { useTheme } from '../../theme/useTheme';
import { ScalePressable } from './ScalePressable';

export interface EmptyStateCardProps {
  icon?: LucideIcon;
  iconName?: keyof typeof LucideIcons;
  title: string;
  description: string;
  buttonLabel: string;
  buttonVariant?: 'lavender' | 'lime';
  onPress: () => void;
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  asCard?: boolean;
}

export function EmptyStateCard({
  icon,
  iconName,
  title,
  description,
  buttonLabel,
  buttonVariant = 'lavender',
  onPress,
  secondaryAction,
  style,
  containerStyle,
  asCard = true,
}: EmptyStateCardProps) {
  const { colors, radius, space, type, shadow } = useTheme();

  // Resolve icon component from either prop
  let IconComponent: LucideIcon = LucideIcons.HelpCircle;
  if (icon) {
    IconComponent = icon;
  } else if (iconName && (LucideIcons as any)[iconName]) {
    IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
  }

  const isLime = buttonVariant === 'lime';
  const buttonBg = isLime ? colors.flash : colors.accent;
  const buttonTextColor = isLime ? '#000000' : colors.textOnAccent;

  return (
    <View
      style={[
        asCard
          ? {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.xl,
              paddingHorizontal: space.xl,
              paddingVertical: 36,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }
          : {
              paddingHorizontal: space.xl,
              paddingVertical: 48,
              alignItems: 'center',
              justifyContent: 'center',
            },
        containerStyle,
      ]}
    >
      <View style={[{ alignItems: 'center', justifyContent: 'center', width: '100%' }, style]}>
        {/* Minimalist Geometric Icon Badge Frame */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.lg,
            backgroundColor: colors.cardMuted,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.md,
            ...shadow.floating,
          }}
        >
          <IconComponent size={28} color={colors.textMuted} strokeWidth={1.8} />
        </View>

        {/* Title */}
        <Text
          style={[
            type.heading,
            {
              color: colors.text,
              textAlign: 'center',
              marginBottom: space.xs,
              fontSize: 18,
            },
          ]}
        >
          {title}
        </Text>

        {/* Body / Description */}
        <Text
          style={[
            type.body,
            {
              color: colors.textMuted,
              textAlign: 'center',
              maxWidth: 280,
              lineHeight: 20,
              fontSize: 14,
              marginBottom: space.xl,
            },
          ]}
        >
          {description}
        </Text>

        {/* Primary CTA Button */}
        <ScalePressable
          onPress={() => {
            triggerHaptic('light');
            onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
          style={{
            height: 48,
            minHeight: 48,
            borderRadius: radius.pill,
            paddingHorizontal: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: buttonBg,
          }}
        >
          <Text
            style={[
              type.heading,
              {
                color: buttonTextColor,
                fontSize: 14,
                fontWeight: '700',
                letterSpacing: 0.2,
              },
            ]}
          >
            {buttonLabel}
          </Text>
        </ScalePressable>

        {/* Optional Secondary Action Link */}
        {secondaryAction && (
          <ScalePressable
            onPress={() => {
              triggerHaptic('light');
              secondaryAction.onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={secondaryAction.label}
            style={{
              marginTop: space.md,
              minHeight: 44,
              paddingVertical: 6,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                type.caption,
                {
                  color: colors.textMuted,
                  fontSize: 13,
                  fontWeight: '500',
                },
              ]}
            >
              {secondaryAction.label}
            </Text>
          </ScalePressable>
        )}
      </View>
    </View>
  );
}
