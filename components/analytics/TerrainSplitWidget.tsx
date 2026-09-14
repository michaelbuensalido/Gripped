import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Compass, Flame, Mountain, ArrowUp, Shield } from 'lucide-react-native';
import type { WallAngleBreakdownItem } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

export interface TerrainSplitWidgetProps {
  data: WallAngleBreakdownItem[];
}

export function TerrainSplitWidget({ data }: TerrainSplitWidgetProps) {
  const getStyleIcon = (style: string, color: string) => {
    switch (style) {
      case 'Overhang':
        return <Flame size={14} color={color} />;
      case 'Slab':
        return <Mountain size={14} color={color} />;
      case 'Roof':
        return <Shield size={14} color={color} />;
      case 'Vertical':
      default:
        return <ArrowUp size={14} color={color} />;
    }
  };

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Compass size={15} color="#8E7CFF" />
          </View>
          <View>
            <Text style={styles.cardTitle}>WALL STYLE & TERRAIN SPLIT</Text>
            <Text style={styles.cardSubtitle}>
              Distribution across wall angles
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2x2 Grid ──────────────────────────────────────── */}
      <View style={styles.grid}>
        {data.map((item) => {
          return (
            <TouchableOpacity
              key={item.style}
              activeOpacity={0.8}
              onPress={() => triggerHaptic('selection')}
              style={styles.gridCard}
            >
              {/* Card Header: Icon + Style Name + Percentage */}
              <View style={styles.cardHeader}>
                <View style={styles.styleNameRow}>
                  {getStyleIcon(item.style, item.color)}
                  <Text style={styles.styleName}>{item.style}</Text>
                </View>
                <Text style={[styles.percentageText, { color: item.color }]}>
                  {item.percentage}%
                </Text>
              </View>

              {/* Horizontal Progress Meter */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(5, item.percentage)}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.countText}>
                  {item.count > 0 ? `${item.count} sends logged` : 'Profile baseline'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C2C35',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 124, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardSubtitle: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#16161A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'space-between',
    minHeight: 92,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  styleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  styleName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    marginTop: 4,
  },
  countText: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '600',
  },
});
