import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timer, Activity } from 'lucide-react-native';
import type { AnalyticsOverview } from '../../db/queries';

interface SessionPacingWidgetProps {
  overview: AnalyticsOverview | null;
}

export function SessionPacingWidget({ overview }: SessionPacingWidgetProps) {
  if (!overview || overview.totalSessions === 0) return null;

  const climbsPerSession = Math.round(overview.totalClimbs / overview.totalSessions);
  const minutesPerClimb = climbsPerSession > 0 ? (overview.avgSessionMinutes / climbsPerSession).toFixed(1) : '0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Activity size={14} color="#E7AE56" />
        <Text style={styles.title}>SESSION PACING</Text>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricValue}>{minutesPerClimb}</Text>
          <Text style={styles.metricSub}>MINUTES / CLIMB</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricBlock}>
          <Text style={styles.metricValue}>{climbsPerSession}</Text>
          <Text style={styles.metricSub}>CLIMBS / SESSION</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricBlock}>
          <Text style={styles.metricValue}>{Math.round(overview.avgSessionMinutes)}</Text>
          <Text style={styles.metricSub}>MINS / SESSION</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C35',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  title: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#2C2C35',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  metricSub: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
