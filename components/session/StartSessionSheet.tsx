import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { useAllSessions } from '../../db/hooks';

interface StartSessionSheetProps {
  visible: boolean;
  onClose: () => void;
  onStart: (gymName: string) => void;
  title?: string;
  subtitle?: string;
}

export function StartSessionSheet({ visible, onClose, onStart, title = "Start a session", subtitle = "Start a session to log your climbs." }: StartSessionSheetProps) {
  const { colors, space, type, radius, shadow } = useTheme();
  
  const sessions = useAllSessions();
  const lastGym = sessions.length > 0 ? sessions[0].gymName : 'Local Gym';
  
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
            <TextInput 
              value={gymName} 
              onChangeText={setGymName} 
              style={[type.body, { backgroundColor: colors.cardMuted, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, minHeight: 56, padding: space.md, marginBottom: space.xl, color: colors.text }]} 
            />

            <PrimaryButton testID="start-session-submit-btn" label="Start session" onPress={() => onStart(gymName)} style={{ marginBottom: space.md }} />
            <SecondaryButton testID="cancel-start-session-btn" label="Cancel" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
