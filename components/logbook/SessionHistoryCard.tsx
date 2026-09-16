import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Video } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import type { SessionSummary } from '../../db/queries';

interface Props {
  session: SessionSummary;
}

function formatSessionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  
  const isToday = 
    d.getDate() === now.getDate() && 
    d.getMonth() === now.getMonth() && 
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = 
    d.getDate() === yesterday.getDate() && 
    d.getMonth() === yesterday.getMonth() && 
    d.getFullYear() === yesterday.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeString = `${hours}:${minutes} ${ampm}`;

  if (isToday) return `Today • ${timeString}`;
  if (isYesterday) return `Yesterday • ${timeString}`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()} • ${timeString}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function SessionHistoryCard({ session }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.98}
      style={styles.card}
      onPress={() => {
        triggerHaptic('light');
        router.push(`/session/detail/${session.id}`);
      }}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>
          {formatSessionDate(session.startTime)}
        </Text>
        {session.hasMedia && (
          <View style={styles.mediaBadge}>
            <Video size={10} color="#8E7CFF" strokeWidth={3} style={{ marginRight: 4 }} />
            <Text style={styles.mediaBadgeText}>MEDIA</Text>
          </View>
        )}
      </View>

      {/* Metrics Row */}
      <Text style={styles.titleText} numberOfLines={1}>
        {session.gymName || 'Climbing Session'}
      </Text>
      <Text style={styles.statsStrip}>
        {session.sendCount} Sends • Peak {session.hardestGrade || 'V?'} • {formatDuration(session.durationMinutes)}
      </Text>

      {/* Mini Pyramid / Grade Pills */}
      {session.gradesSent && session.gradesSent.length > 0 && (
        <View style={styles.pyramidRow}>
          {session.gradesSent.slice(0, 3).map((grade, index) => {
            const isTop = index === 0;
            return (
              <View 
                key={`${grade}-${index}`} 
                style={[
                  styles.gradePill, 
                  isTop && styles.topGradePill
                ]}
              >
                <Text style={[
                  styles.gradeText,
                  isTop && styles.topGradeText
                ]}>
                  {grade}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'column',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '600',
  },
  mediaBadge: {
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaBadgeText: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  statsStrip: {
    color: '#9A9AA6',
    fontSize: 13,
    fontWeight: '500',
  },
  pyramidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  gradePill: {
    backgroundColor: 'rgba(142, 124, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.45)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gradeText: {
    color: '#8E7CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  topGradePill: {
    backgroundColor: '#6EE756',
    borderColor: '#6EE756',
    borderWidth: 0,
    shadowColor: '#6EE756',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  topGradeText: {
    color: '#111115',
  }
});
