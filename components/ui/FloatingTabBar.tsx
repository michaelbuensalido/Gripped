import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/useTheme';
import { Home, Plus, TrendingUp, User, Target, Play, BookOpen } from 'lucide-react-native';
import { useSessionActions } from '../../hooks/useSessionActions';
import { useSessionStore } from '../../store/sessionStore';
import { StartSessionSheet } from '../session/StartSessionSheet';
import { AccessibilityInfo } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 60) return '<1 min';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function CenterSessionButton({ activeSession, startOrResume, onOpenStartSheet }: any) {
  const { colors, radius, shadow, type } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    const start = activeSession.startTime;
    setElapsed(Date.now() - start);
    const interval = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (activeSession && !reduceMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [activeSession, reduceMotion]);

  const label = activeSession ? "Resume" : "Start";
  const displayTime = activeSession ? formatDuration(elapsed) : null;

  const handlePress = () => {
    if (activeSession) {
      startOrResume(); // routes to active
    } else {
      triggerHaptic('light');
      onOpenStartSheet();
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'flex-start', flex: 1, marginTop: -20 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={activeSession ? `Resume session, ${displayTime} elapsed` : "Start session"}
        style={[
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: colors.bg,
            zIndex: 10,
          },
          shadow.floating
        ]}
      >
        {activeSession && !reduceMotion && (
          <Animated.View style={{
            position: 'absolute', width: 56, height: 56, borderRadius: 28,
            borderWidth: 2, borderColor: colors.accent,
            transform: [{ scale: pulseAnim }], opacity: 0.3
          }} pointerEvents="none" />
        )}
        
        {activeSession ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textOnAccent, fontSize: 13, fontWeight: '700', fontFamily: type.heading.fontFamily }}>{displayTime}</Text>
          </View>
        ) : (
          <Plus size={24} color={colors.textOnAccent} strokeWidth={2.5} />
        )}
      </TouchableOpacity>
      <Text 
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ 
          color: colors.textMuted, 
          fontFamily: type.heading.fontFamily, 
          fontSize: 11, 
          fontWeight: '600', 
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const visibleTabs = ['index', 'projects', 'analytics', 'profile'];

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const { colors, radius, shadow, type } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { activeSession, startOrResume } = useSessionActions();
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
    const setLastTab = useSessionStore(s => s.setLastTab);

  useEffect(() => {
    const activeRoute = state.routes[state.index];
    if (visibleTabs.includes(activeRoute.name)) {
      setLastTab('/' + (activeRoute.name === 'index' ? '' : activeRoute.name));
    }
  }, [state.index, state.routes]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  if (keyboardVisible || state.routes[state.index].name.startsWith('session')) return null;

    const routes = state.routes.filter((r: any) => visibleTabs.includes(r.name));

  return (
    <>
      <View style={[styles.container, shadow.floating, { bottom: 24, left: 16, right: 16, borderRadius: radius.pill, overflow: 'visible' }]}>
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }]} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, paddingHorizontal: 4, overflow: 'visible' }}>
          {routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key);

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                setLastTab('/' + (route.name === 'index' ? '' : route.name));
                navigation.navigate(route.name, route.params);
              }
            };

            let label = options.title !== undefined ? options.title : route.name;
            let IconComponent = Home;
            if (route.name === 'index') { IconComponent = Home; label = "Home"; }
            else if (route.name === 'projects') { IconComponent = Target; label = "Projects"; }
            else if (route.name === 'analytics') { IconComponent = TrendingUp; label = "Progress"; }
            else if (route.name === 'profile') { IconComponent = BookOpen; label = "Logbook"; }

            const tabElement = (
              <TouchableOpacity
                testID={`${route.name}-tab`}
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
              >
                <View style={{
                  flexDirection: 'column', alignItems: 'center',
                  backgroundColor: isFocused ? colors.accentSoft : 'transparent',
                  paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.pill, minWidth: 54,
                }}>
                  <IconComponent size={20} color={isFocused ? colors.accentText : colors.textMuted} strokeWidth={isFocused ? 2.5 : 2} />
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: isFocused ? colors.accentText : colors.textMuted, fontFamily: type.heading.fontFamily, fontSize: 11, fontWeight: isFocused ? '600' : '500', marginTop: 2 }}>
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );

            // Insert center button after Projects (index 1)
            if (index === 1) {
              return (
                <React.Fragment key={route.key}>
                  {tabElement}
                  <CenterSessionButton activeSession={activeSession} startOrResume={startOrResume} onOpenStartSheet={() => setIsStartSheetOpen(true)} />
                </React.Fragment>
              );
            }
            return tabElement;
          })}
        </View>
      </View>

      <StartSessionSheet 
        visible={isStartSheetOpen} 
        onClose={() => setIsStartSheetOpen(false)} 
        onStart={(gymName) => {
          setIsStartSheetOpen(false);
          startOrResume(gymName);
        }} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
});
