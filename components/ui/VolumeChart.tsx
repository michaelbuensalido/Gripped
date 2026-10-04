import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/useTheme';
import { GlowBackdrop } from './GlowBackdrop';

export interface VolumeChartProps {
  data: { weekLabel: string; climbs: number; isCurrent: boolean }[];
  onPress?: () => void;
}

export function VolumeChart({ data, onPress }: VolumeChartProps) {
  const { colors, type, space, radius } = useTheme();
  const maxClimbs = Math.max(...data.map(d => d.climbs), 1);
  const MAX_BAR_HEIGHT = 70;

  const currentWeek = data[data.length - 1] || { climbs: 0 };
  const lastWeek = data[data.length - 2] || { climbs: 0 };
  const diff = currentWeek.climbs - lastWeek.climbs;

  let changeLabel = 'Same as last week';
  let changeColor = 'rgba(255,255,255,0.4)';

  if (lastWeek.climbs === 0) {
    changeLabel = 'First week logged';
  } else if (diff > 0) {
    changeLabel = `↑ ${diff} vs last week`;
    changeColor = colors.flash; // Neon Green
  } else if (diff < 0) {
    changeLabel = `↓ ${Math.abs(diff)} vs last week`;
    changeColor = colors.danger; // Red/Pink
  }

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: radius.xl,
        padding: space.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.xl }}>
        <View>
          <Text style={[type.label, { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 4 }]}>
            WEEKLY VOLUME
          </Text>
          <Text style={[type.heading, { color: colors.textWhitePrimary, fontSize: 16 }]}>
            {currentWeek.climbs} Climbs
          </Text>
        </View>
        <Text style={[type.caption, { color: changeColor, fontSize: 11, fontWeight: '600' }]}>
          {changeLabel}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: MAX_BAR_HEIGHT + 20 }}>
        {data.map((item, i) => {
          const h = item.climbs === 0 ? 2 : (item.climbs / maxClimbs) * MAX_BAR_HEIGHT;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ height: MAX_BAR_HEIGHT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                {item.isCurrent ? (
                  <View style={{ height: h, width: 14, alignItems: 'center', justifyContent: 'flex-end' }}>
                    {/* Glowing Blur Background */}
                    <View style={{ position: 'absolute', bottom: 0, width: 24, height: h + 10, opacity: 0.3, pointerEvents: 'none' }}>
                      <GlowBackdrop spread={16} />
                    </View>
                    
                    {/* The Active Line */}
                    <LinearGradient
                      colors={[colors.accent, 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ width: 2, height: h, borderRadius: 1 }}
                    />
                    
                    {/* Top Dot */}
                    <View style={{ position: 'absolute', top: -3, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textWhitePrimary }} />
                  </View>
                ) : (
                  <View style={{ height: h, width: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                     {item.climbs > 0 && <View style={{ position: 'absolute', top: -2, width: 4, height: 4, left: -1, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />}
                  </View>
                )}
              </View>
              <Text numberOfLines={1} style={[type.label, { color: item.isCurrent ? colors.textWhitePrimary : 'rgba(255,255,255,0.3)', marginTop: space.md, fontSize: 9, letterSpacing: 0.5 }]}>
                {i % 2 === 1 || item.isCurrent ? item.weekLabel : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}
