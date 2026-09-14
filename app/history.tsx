import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Flame, TrendingUp } from 'lucide-react-native';
import { getAllSessionSummaries, type SessionSummary } from '../db/queries';
import { useSessionStore } from '../store/sessionStore';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { FLOATING_CARD_STYLE, THEME_COLORS } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';

function formatSessionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${month} ${day} • ${hours}:${minutes} ${ampm}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  const loadSessions = useCallback(() => {
    try {
      const all = getAllSessionSummaries();
      setSessions(all);
    } catch (e) {
      console.error('Error loading session history:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleStartQuickSession = () => {
    triggerHaptic('medium');
    const sessionId = useSessionStore.getState().startQuickSession('Quick Session');
    router.push(`/session/${sessionId}`);
  };

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 180,
          paddingHorizontal: 16,
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Session History</Text>
            <Text style={styles.headerSubtitle}>Past workouts & send summaries</Text>
          </View>
        </View>

        {/* Content / Zero State */}
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyStateCard
              icon={Calendar}
              title="No Sessions Logged Yet"
              description="Your past workouts, send pyramids, and gym volume stats will appear here once you log your first burn."
              buttonLabel="Start a Quick Session"
              buttonVariant="lime"
              onPress={handleStartQuickSession}
            />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {sessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/session/detail/${s.id}`)}
                style={[FLOATING_CARD_STYLE, styles.sessionCard]}
              >
                <View style={styles.sessionCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gymName} numberOfLines={1}>
                      {s.gymName || 'Climbing Session'}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {formatSessionDate(s.startTime)}
                    </Text>
                  </View>

                  {Boolean(s.hardestGrade) && (
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeBadgeText}>{s.hardestGrade}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sessionStatsRow}>
                  <View style={styles.statItem}>
                    <Clock size={13} color="#8A8A98" />
                    <Text style={styles.statText}>{formatDuration(s.durationMinutes)}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <TrendingUp size={13} color="#6EE756" />
                    <Text style={[styles.statText, { color: '#6EE756' }]}>
                      {s.sendCount} sends
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Flame size={13} color="#8E7CFF" />
                    <Text style={[styles.statText, { color: '#8E7CFF' }]}>
                      {s.flashCount} flashes
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    paddingTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8A8A98',
    marginTop: 2,
  },
  emptyContainer: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    gap: 12,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionDate: {
    fontSize: 12,
    color: '#8A8A98',
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: 'rgba(110, 231, 86, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 86, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6EE756',
  },
  sessionStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A98',
  },
});
