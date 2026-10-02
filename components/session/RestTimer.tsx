import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Pause, FastForward, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../store/sessionStore';
import { triggerHaptic } from '../../utils/haptics';

export function RestTimer() {
  const { colors, space, radius, type } = useTheme();
  
  const restTimerEndTime = useSessionStore(s => s.restTimerEndTime);
  const isRestTimerRunning = useSessionStore(s => s.isRestTimerRunning);
  const setRestTimer = useSessionStore(s => s.setRestTimer);
  const addRestTimerSeconds = useSessionStore(s => s.addRestTimerSeconds);

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!restTimerEndTime || !isRestTimerRunning) {
      if (restTimerEndTime && !isRestTimerRunning) {
        setRemaining(Math.max(0, restTimerEndTime - Date.now()));
      }
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const left = Math.max(0, restTimerEndTime - now);
      setRemaining(left);

      if (left === 0) {
        setRestTimer(null, false);
        triggerHaptic('success');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [restTimerEndTime, isRestTimerRunning, setRestTimer]);

  const toggleTimer = () => {
    if (!restTimerEndTime) {
      // Start fresh 3:00
      setRestTimer(Date.now() + 3 * 60 * 1000, true);
      triggerHaptic('light');
    } else if (isRestTimerRunning) {
      // Pause
      setRestTimer(Date.now() + remaining, false); // Store the current time + remaining effectively pausing
      triggerHaptic('light');
    } else {
      // Resume
      setRestTimer(Date.now() + remaining, true);
      triggerHaptic('light');
    }
  };

  const handleSkip = () => {
    setRestTimer(null, false);
    setRemaining(0);
    triggerHaptic('light');
  };

  const handleAdd30s = () => {
    if (!restTimerEndTime) {
      setRestTimer(Date.now() + 30 * 1000, true);
    } else {
      addRestTimerSeconds(30);
    }
    triggerHaptic('light');
  };

  const formatRemaining = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!restTimerEndTime && remaining === 0) return null;

  const isComplete = remaining === 0;

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isComplete ? colors.success : colors.cardMuted,
      borderRadius: radius.pill,
      padding: 4,
      marginTop: space.xs,
    }}>
      <TouchableOpacity
        onPress={toggleTimer}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.sm,
          paddingVertical: 4,
          gap: space.xs,
        }}
      >
        {isRestTimerRunning ? (
          <Pause size={14} color={isComplete ? colors.textOnAccent : colors.text} />
        ) : (
          <Play size={14} color={isComplete ? colors.textOnAccent : colors.text} />
        )}
        <Text style={[type.label, { color: isComplete ? colors.textOnAccent : colors.text, minWidth: 40, textAlign: 'center' }]}>
          {isComplete ? 'REST COMPLETE' : formatRemaining(remaining)}
        </Text>
      </TouchableOpacity>
      
      {!isComplete && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 4 }}>
          <View style={{ width: 1, height: 16, backgroundColor: colors.border, marginHorizontal: 4 }} />
          <TouchableOpacity testID="add-30s-btn" onPress={handleAdd30s} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}>
            <Plus size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity testID="skip-rest-btn" onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}>
            <FastForward size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
