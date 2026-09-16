import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BetaCameraRecorder } from '../../components/media/BetaCameraRecorder';
import { useSessionStore } from '../../store/sessionStore';

export default function CameraScreen() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.back();
  };

  const handleAttach = (
    mediaUri: string,
    mediaType: 'video' | 'photo',
    gradeRaw?: string,
    notes?: string
  ) => {
    setIsOpen(false);
    try {
      const store = useSessionStore.getState();
      let sessionId: string;
      if (store.activeSession) {
        sessionId = store.activeSession.id;
      } else {
        sessionId = store.startQuickSession('Set Grader');
      }
      const currentGroups = store.groups;
      if (currentGroups.length > 0 && currentGroups[0].logs.length > 0) {
        store.commitSetGrading(currentGroups[0].id, currentGroups[0].logs[0].id, {
          gradeRaw: gradeRaw || 'V5',
          mediaUri,
          mediaType,
          notes,
        });
      }
    } catch (e) {
      console.error('Error saving camera capture:', e);
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <BetaCameraRecorder
        visible={isOpen}
        onClose={handleClose}
        onAttach={handleAttach}
      />
    </View>
  );
}
