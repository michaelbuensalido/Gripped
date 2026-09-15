import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

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
  // Resolve icon component from either prop
  let IconComponent: LucideIcon = LucideIcons.HelpCircle;
  if (icon) {
    IconComponent = icon;
  } else if (iconName && (LucideIcons as any)[iconName]) {
    IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
  }

  const isLime = buttonVariant === 'lime';
  const buttonBg = isLime ? '#6EE756' : '#8E7CFF';
  const buttonTextColor = isLime ? '#111115' : '#FFFFFF';

  return (
    <View
      style={[
        asCard ? styles.cardContainer : styles.rawContainer,
        containerStyle,
      ]}
    >
      <View style={[styles.innerContent, style]}>
        {/* Minimalist Geometric Icon Badge Frame */}
        <View style={styles.badgeFrame}>
          <IconComponent size={28} color="#8A8A98" strokeWidth={1.8} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Body / Description */}
        <Text style={styles.description}>{description}</Text>

        {/* Primary CTA Button */}
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            onPress();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: buttonBg,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: buttonTextColor }]}>
            {buttonLabel}
          </Text>
        </Pressable>

        {/* Optional Secondary Action */}
        {secondaryAction && (
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              secondaryAction.onPress();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {secondaryAction.label}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rawContainer: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  badgeFrame: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    // Subtle tactile shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A8A98',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Tactile glow/shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#111115',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
