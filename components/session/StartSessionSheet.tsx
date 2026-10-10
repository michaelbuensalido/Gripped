import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useReducedMotion,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { useRecentGyms } from '../../db/hooks';
import { Chip } from '../ui/Chip';
import { triggerHaptic } from '../../utils/haptics';

interface StartSessionSheetProps {
  visible: boolean;
  onClose: () => void;
  onStart: (gymName: string) => void;
  title?: string;
  subtitle?: string;
}

export function StartSessionSheet({
  visible,
  onClose,
  onStart,
  title = "Start a session",
  subtitle = "Start a session to log your climbs."
}: StartSessionSheetProps) {
  const { colors, space, type, radius, shadow, motion } = useTheme();
  const reduceMotion = useReducedMotion();
  
  const recentGyms = useRecentGyms();
  const lastGym = recentGyms.length > 0 ? recentGyms[0] : 'Local Gym';
  
  const [gymName, setGymName] = useState(lastGym);
  const [isRendered, setIsRendered] = useState(visible);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      setGymName(lastGym);
      if (reduceMotion) {
        backdropOpacity.value = 1;
        sheetTranslateY.value = 0;
      } else {
        backdropOpacity.value = withTiming(1, {
          duration: motion.duration.fast,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        });
        sheetTranslateY.value = withSpring(0, {
          damping: motion.sheetSpring.damping,
          stiffness: motion.sheetSpring.stiffness,
        });
      }
    } else if (isRendered) {
      handleCloseAnimation();
    }
  }, [visible, lastGym]);

  const handleCloseAnimation = () => {
    if (reduceMotion) {
      backdropOpacity.value = 0;
      sheetTranslateY.value = 400;
      setIsRendered(false);
      onClose();
      return;
    }

    backdropOpacity.value = withTiming(0, {
      duration: motion.duration.fast,
      easing: Easing.in(Easing.cubic),
    });
    sheetTranslateY.value = withTiming(380, {
      duration: motion.duration.fast,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(setIsRendered)(false);
        runOnJS(onClose)();
      }
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!visible && !isRendered) return null;

  return (
    <Modal visible={isRendered} transparent onRequestClose={handleCloseAnimation}>
      <View style={styles.modalRoot}>
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
              borderColor: colors.border,
              padding: space.xl,
              paddingBottom: space.xxl + 24,
              ...shadow.floating,
            },
            sheetStyle,
          ]}
        >
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

          <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>
            Gym / Location
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.xl }}>
            <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
              {recentGyms.map((gym) => (
                <Chip
                  key={gym}
                  label={gym}
                  active={gymName === gym}
                  onPress={() => {
                    setGymName(gym);
                  }}
                />
              ))}
              <TextInput
                value={!recentGyms.includes(gymName) ? gymName : ''}
                onChangeText={setGymName}
                placeholder="+ Add new gym"
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    backgroundColor: !recentGyms.includes(gymName) && gymName !== '' ? colors.accent : colors.cardMuted,
                    color: !recentGyms.includes(gymName) && gymName !== '' ? colors.textOnAccent : colors.text,
                    paddingHorizontal: space.md,
                    height: 38,
                    borderRadius: 19,
                    minWidth: 120,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
          </ScrollView>

          <PrimaryButton
            testID="start-session-submit-btn"
            label="Start session"
            onPress={() => onStart(gymName)}
            style={{ marginBottom: space.md }}
            disabled={!gymName.trim()}
          />
          <SecondaryButton
            testID="cancel-start-session-btn"
            label="Cancel"
            onPress={handleCloseAnimation}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
