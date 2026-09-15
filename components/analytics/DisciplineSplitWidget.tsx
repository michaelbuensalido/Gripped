import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Compass, Zap, Flame, Mountain, Target } from 'lucide-react-native';
import type { DisciplineSplitItem } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

export interface DisciplineSplitWidgetProps {
  disciplines: DisciplineSplitItem[];
}

export function DisciplineSplitWidget({ disciplines }: DisciplineSplitWidgetProps) {
  const getIcon = (id: string, color: string) => {
    switch (id) {
      case 'overhang':
        return <Flame size={14} color={color} />;
      case 'slab':
        return <Mountain size={14} color={color} />;
      case 'crimpy':
        return <Target size={14} color={color} />;
      case 'dynamic':
      default:
        return <Zap size={14} color={color} />;
    }
  };

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Compass size={14} color="#8E7CFF" />
          </View>
          <View>
            <Text style={styles.cardTitle}>WALL ANGLE & STYLE</Text>
            <Text style={styles.cardSubtitle}>Discipline breakdown & preference</Text>
          </View>
        </View>
      </View>

      {/* ── 2x2 Grid ──────────────────────────────────────── */}
      <View style={styles.grid}>
        {disciplines.map((item) => {
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => triggerHaptic('selection')}
              style={styles.gridCard}
            >
              {/* Card Header */}
              <View style={styles.cardTopRow}>
                <View style={styles.styleNameRow}>
                  {getIcon(item.id, item.color)}
                  <Text style={styles.styleName}>{item.label}</Text>
                </View>
                <Text style={[styles.percentageText, { color: item.color }]}>
                  {item.percentage}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(4, item.percentage)}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>

              {/* Card Footer: Sends Count */}
              <View style={styles.cardBottomRow}>
                <Text style={styles.sendsText}>
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
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    minHeight: 90,
  },
  cardTopRow: {
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
  cardBottomRow: {
    marginTop: 4,
  },
  sendsText: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '600',
  },
});
