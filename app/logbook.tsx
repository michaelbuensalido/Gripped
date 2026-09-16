import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { TrendingUp, Plus } from 'lucide-react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { SessionHistoryCard } from '../components/logbook/SessionHistoryCard';
import { useSessionStore } from '../store/sessionStore';
import { getAllSessionSummaries, type SessionSummary } from '../db/queries';
import { triggerHaptic } from '../utils/haptics';

function formatMonthYear(timestamp: number): string {
  const d = new Date(timestamp);
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function LogbookScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  const loadData = useCallback(() => {
    try {
      setSessions(getAllSessionSummaries());
    } catch (err) {
      console.error('Failed to load logbook data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Group sessions by Month/Year
  const sessionsByMonth = useMemo(() => {
    const groups: { monthYear: string; items: SessionSummary[] }[] = [];
    sessions.forEach((s) => {
      const my = formatMonthYear(s.startTime);
      let group = groups.find((g) => g.monthYear === my);
      if (!group) {
        group = { monthYear: my, items: [] };
        groups.push(group);
      }
      group.items.push(s);
    });
    return groups;
  }, [sessions]);

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 170, // Prevents bottom floating tab overlap
        }}
      >
        {/* ── Top Header ────────────────────────────────────────── */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 34,
              fontWeight: '700',
              letterSpacing: -0.5,
            }}
          >
            Logbook
          </Text>
          <Text
            style={{
              color: '#9A9AA6',
              fontSize: 14,
              marginTop: 4,
              fontWeight: '400',
            }}
          >
            Your chronological session history
          </Text>
        </View>

        {/* ── Sessions History Feed ─────────────────────────── */}
        {sessions.length === 0 ? (
          <EmptyStateCard
            icon={TrendingUp}
            title="No Sessions Logged Yet"
            description="Your past workouts, send pyramids, and gym volume stats will appear here once you log your first burn."
            buttonLabel="Start a Quick Session"
            buttonVariant="lime"
            onPress={() => {
              const sessionId = useSessionStore.getState().startQuickSession('Quick Session');
              router.push(`/session/${sessionId}`);
            }}
          />
        ) : (
          <View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                const sessionId = useSessionStore.getState().startQuickSession('Quick Session');
                router.push(`/session/${sessionId}`);
              }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1E1E24',
                borderColor: '#2C2C35',
                borderWidth: 1,
                borderRadius: 16,
                height: 52,
                marginBottom: 24,
                gap: 8,
              }}
            >
              <Plus size={18} color="#8E7CFF" strokeWidth={2.5} />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                Start New Session
              </Text>
            </TouchableOpacity>

            {sessionsByMonth.map((group) => (
              <View key={group.monthYear} style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: '#8A8A98',
                    fontSize: 12,
                    fontWeight: '700',
                    letterSpacing: 1.2,
                    marginBottom: 12,
                    paddingHorizontal: 4,
                  }}
                >
                  {group.monthYear}
                </Text>

                {group.items.map((s) => (
                  <SessionHistoryCard key={s.id} session={s} />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
