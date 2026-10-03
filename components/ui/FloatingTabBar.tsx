import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/useTheme';
import { Home, TrendingUp, Target, Settings } from 'lucide-react-native';
import { useSessionActions } from '../../hooks/useSessionActions';
import { useSessionStore } from '../../store/sessionStore';
import { StartSessionSheet } from '../session/StartSessionSheet';

const visibleTabs = ['index', 'projects', 'analytics', 'settings'];

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
      <View style={[styles.container, shadow.floating, { bottom: 24, left: 20, right: 20, borderRadius: radius.pill, overflow: 'hidden' }]}>
        {/* Frosted glass layer */}
        {Platform.OS === 'ios' ? (
          <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
        ) : null}
        <View
          style={[StyleSheet.absoluteFill, {
            backgroundColor: 'rgba(20, 20, 28, 0.82)',
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }]}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 68, paddingHorizontal: 8 }}>
          {routes.map((route: any) => {
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
            let IconComponent: any = Home;
            if (route.name === 'index') { IconComponent = Home; label = "Home"; }
            else if (route.name === 'projects') { IconComponent = Target; label = "Routes"; }
            else if (route.name === 'analytics') { IconComponent = TrendingUp; label = "Progress"; }
            else if (route.name === 'settings') { IconComponent = Settings; label = "Settings"; }

            return (
              <TouchableOpacity
                testID={`${route.name}-tab`}
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
              >
                <View style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isFocused ? 'rgba(154, 133, 255, 0.22)' : 'transparent',
                  paddingHorizontal: isFocused ? 14 : 10,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  minWidth: 58,
                }}>
                  <IconComponent
                    size={22}
                    color={isFocused ? '#B89EFF' : '#727280'}
                    strokeWidth={isFocused ? 2 : 1.75}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: isFocused ? '#B89EFF' : '#727280',
                      fontFamily: type.heading.fontFamily,
                      fontSize: 10,
                      fontWeight: isFocused ? '600' : '500',
                      marginTop: 3,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
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
