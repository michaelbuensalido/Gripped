import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession } from '../../db/hooks';
import { triggerHaptic } from '../../utils/haptics';

export function GlobalSessionBanner() {
  const session = useActiveSession();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, type, radius } = useTheme();
  
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session) return;
    const update = () => setElapsed(Date.now() - session.startTime);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;
  // Don't show banner if we are already inside the session flow
  if (pathname.startsWith('/session/')) return null;

  const totalSecs = Math.floor(elapsed / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <View style={{
      position: 'absolute',
      top: insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24),
      left: 16,
      right: 16,
      zIndex: 999,
    }}>
      <TouchableOpacity
        testID="session-banner"
        activeOpacity={0.8}
        onPress={() => {
          triggerHaptic('light');
          router.push('/session/active');
        }}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.flashText,
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Play size={14} color={colors.flashText} style={{ marginRight: 8 }} />
        <Text style={[type.caption, { color: colors.flashText, fontWeight: '700' }]}>
          SESSION ACTIVE · {timeStr} · RESUME
        </Text>
      </TouchableOpacity>
    </View>
  );
}
