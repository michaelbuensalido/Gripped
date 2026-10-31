import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../theme/useTheme';
import { useSheetMotion } from '../../hooks/useSheetMotion';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { useRecentGyms } from '../../db/hooks';
import { getLastUsedGym, insertGym } from '../../db/queries';
import { Chip } from '../ui/Chip';
import { triggerHaptic } from '../../utils/haptics';
import { usePreferences } from '../../utils/preferences';

interface StartSessionSheetProps {
  visible: boolean;
  onClose: () => void;
  onStart: (gymName: string) => void;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
}

export function StartSessionSheet({
  visible,
  onClose,
  onStart,
  title = "Start a session",
  subtitle = "Pick where you're climbing today.",
  ctaLabel = "Start session",
}: StartSessionSheetProps) {
  const { colors, space, type, radius, shadow } = useTheme();
  const { homeGym } = usePreferences();
  
  const recentGyms = useRecentGyms();
  const gymOptions = useMemo(() => {
    const base = recentGyms.length > 0 ? [...recentGyms] : ['Local Gym'];
    if (homeGym && !base.some((g) => g.toLowerCase() === homeGym.toLowerCase())) {
      base.unshift(homeGym);
    }
    if (!base.some((g) => g.toLowerCase() === 'outdoor')) {
      base.push('Outdoor');
    }
    return base;
  }, [recentGyms, homeGym]);

  const defaultGym = useMemo(() => {
    try {
      const last = getLastUsedGym();
      if (last) return last;
    } catch {}
    return homeGym || gymOptions[0] || 'Local Gym';
  }, [gymOptions, homeGym, visible]);
  
  const [gymName, setGymName] = useState(defaultGym);
  const { isRendered, backdropStyle, sheetStyle, panGesture, close } = useSheetMotion(visible, onClose);

  useEffect(() => {
    if (visible) setGymName(defaultGym);
  }, [visible, defaultGym]);

  const handleCloseAnimation = () => close();

  const handleStart = () => {
    const trimmed = gymName.trim() || defaultGym || 'Local Gym';
    try {
      insertGym(trimmed);
    } catch {}
    // Slide the sheet away first; session creation / navigation runs once it is gone.
    close(() => onStart(trimmed), { notifyParent: false });
  };

  if (!visible && !isRendered) return null;

  return (
    <Modal visible={isRendered} transparent animationType="none" onRequestClose={handleCloseAnimation}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          {/* Animated backdrop scrim */}
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseAnimation} />
          </Animated.View>

          {/* Animated bottom sheet */}
          <Animated.View
            style={[
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                padding: space.xl,
                paddingBottom: space.xxl + 24,
                ...shadow.floating,
              },
              sheetStyle,
            ]}
          >
            {/* Top Specular Glass Rim */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            />

            <GestureDetector gesture={panGesture}>
              <Animated.View>
                {/* Drag Pill */}
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    alignSelf: 'center',
                    marginBottom: space.lg,
                  }}
                />

                <View style={{ marginBottom: space.xl }}>
                  <Text style={[type.title, { color: colors.text, marginBottom: space.xs, fontWeight: '700' }]}>
                    {title}
                  </Text>
                  <Text style={[type.body, { color: colors.textMuted }]}>
                    {subtitle}
                  </Text>
                </View>
              </Animated.View>
            </GestureDetector>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>
              Gym / Location
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ marginBottom: space.xl }}
            >
              <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                {gymOptions.map((gym) => (
                  <Chip
                    key={gym}
                    label={gym}
                    active={gymName === gym}
                    onPress={() => {
                      triggerHaptic('selection');
                      setGymName(gym);
                    }}
                  />
                ))}
                <TextInput
                  value={!gymOptions.includes(gymName) ? gymName : ''}
                  onChangeText={setGymName}
                  placeholder="+ Custom gym"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="go"
                  onSubmitEditing={handleStart}
                  style={[
                    type.body,
                    {
                      backgroundColor: !gymOptions.includes(gymName) && gymName !== '' ? colors.accent : colors.cardMuted,
                      color: !gymOptions.includes(gymName) && gymName !== '' ? colors.textOnAccent : colors.text,
                      paddingHorizontal: space.md,
                      height: 38,
                      borderRadius: 19,
                      minWidth: 130,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>
            </ScrollView>

            <PrimaryButton
              testID="start-session-submit-btn"
              label={ctaLabel}
              onPress={handleStart}
              style={{ marginBottom: space.md }}
              disabled={!gymName.trim()}
            />
            <SecondaryButton
              testID="cancel-start-session-btn"
              label="Cancel"
              onPress={handleCloseAnimation}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
