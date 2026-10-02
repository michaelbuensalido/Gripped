import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RotateCcw } from 'lucide-react-native';

export function UndoToast({ visible, onUndo, onDismiss, message = "Climb deleted" }: { visible: boolean; onUndo: () => void; onDismiss: () => void; message?: string }) {
  const { colors, type, radius, shadow } = useTheme();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <View style={[styles.container, shadow.floating, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}>
      <Text style={[type.body, { color: colors.text }]}>{message}</Text>
      <TouchableOpacity testID="undo-toast-btn" onPress={onUndo} style={styles.btn}>
        <RotateCcw size={16} color={colors.accent} style={{ marginRight: 6 }} />
        <Text style={[type.heading, { color: colors.accentText }]}>UNDO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    zIndex: 1000,
  },
  btn: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  }
});
