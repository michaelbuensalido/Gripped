import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/useTheme';
import { Home, Compass, Plus, TrendingUp, User, Target, BookOpen } from 'lucide-react-native';

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const { colors, radius, shadow, type } = useTheme();

  return (
    <View style={[styles.container, shadow.floating, { bottom: 24, left: 16, right: 16, borderRadius: radius.pill }]}>
      <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, backgroundColor: colors.glass, overflow: 'hidden' }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 64, paddingHorizontal: 8 }}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          
          const visibleTabs = ['index', 'projects', 'analytics', 'profile'];
          if (!visibleTabs.includes(route.name)) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          let label = options.title !== undefined ? options.title : route.name;
          
          let IconComponent = Home;
          if (route.name === 'index') { IconComponent = Home; label = "Home"; }
          else if (route.name === 'explore') { IconComponent = Compass; label = "Explore"; }
          else if (route.name === 'projects') { IconComponent = Target; label = "Projects"; }
          else if (route.name === 'analytics') { IconComponent = TrendingUp; label = "Progress"; }
          else if (route.name === 'profile') { IconComponent = BookOpen; label = "Logbook"; }
          else if (route.name === 'profile') { IconComponent = User; label = "Profile"; }

          return (
            <TouchableOpacity
              testID={`${route.name}-tab`}
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isFocused ? colors.accentSoft : 'transparent',
                paddingHorizontal: isFocused ? 14 : 0,
                paddingVertical: 10,
                borderRadius: radius.pill,
              }}>
                <IconComponent 
                  size={20} 
                  color={isFocused ? colors.accentText : colors.textMuted} 
                  strokeWidth={isFocused ? 2.5 : 2} 
                />
                {isFocused && (
                  <Text style={[{ color: colors.accentText, fontFamily: type.heading.fontFamily, fontSize: 13, fontWeight: '600', marginLeft: 6 }]}>
                    {label}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
