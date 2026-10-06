import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, Pressable, ScrollView } from 'react-native';
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

export function StartSessionSheet({ visible, onClose, onStart, title = "Start a session", subtitle = "Start a session to log your climbs." }: StartSessionSheetProps) {
  const { colors, space, type, radius, shadow } = useTheme();
  
  const recentGyms = useRecentGyms();
  const lastGym = recentGyms.length > 0 ? recentGyms[0] : 'Local Gym';
  
  const [gymName, setGymName] = useState(lastGym);

  useEffect(() => {
    if (visible) {
      setGymName(lastGym);
    }
  }, [visible, lastGym]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: space.xl, paddingBottom: space.xxl + 24, ...shadow.floating }}>
            
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space.lg }} />
            <View style={{ marginBottom: space.xl }}>
              <Text style={[type.title, { color: colors.text, marginBottom: space.xs }]}>{title}</Text>
              <Text style={[type.body, { color: colors.textMuted }]}>{subtitle}</Text>
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>Gym / Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.xl }}>
              <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                {recentGyms.map((gym) => (
                  <Chip
                    key={gym}
                    label={gym}
                    active={gymName === gym}
                    onPress={() => {
                      triggerHaptic('light');
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
                      height: 36,
                      borderRadius: 18,
                      minWidth: 120,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>
            </ScrollView>

            <PrimaryButton testID="start-session-submit-btn" label="Start session" onPress={() => onStart(gymName)} style={{ marginBottom: space.md }} disabled={!gymName.trim()} />
            <SecondaryButton testID="cancel-start-session-btn" label="Cancel" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
