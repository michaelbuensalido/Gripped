import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, Settings as SettingsIcon } from "lucide-react-native";
import { ScreenContainer } from "../components/ui/ScreenContainer";
import { SessionHistoryCard } from "../components/logbook/SessionHistoryCard";
import {
  LogbookFilterStrip,
  type LogbookFilter,
} from "../components/logbook/LogbookFilterStrip";
import { ConsistencyLedger } from "../components/analytics/ConsistencyLedger";
import { useSessionStore } from "../store/sessionStore";
import { getAllSessionSummaries, type SessionSummary } from "../db/queries";
import { triggerHaptic } from "../utils/haptics";

function formatMonthYear(timestamp: number): string {
  const d = new Date(timestamp);
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function LogbookScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeFilter, setActiveFilter] = useState<LogbookFilter>("all");

  const loadData = useCallback(() => {
    try {
      setSessions(getAllSessionSummaries());
    } catch (err) {
      console.error("Failed to load logbook data:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filteredSessions = useMemo(() => {
    switch (activeFilter) {
      case "sent":
        return sessions.filter((s) => s.sendCount > 0);
      case "video":
        return sessions.filter((s) => s.hasMedia);
      case "v5plus": {
        return sessions.filter((s) => {
          if (!s.hardestGrade) return false;
          const num = parseInt(s.hardestGrade.replace("V", ""), 10);
          return !isNaN(num) && num >= 5;
        });
      }
      default:
        return sessions;
    }
  }, [sessions, activeFilter]);

  const sessionsByMonth = useMemo(() => {
    const groups: { monthYear: string; items: SessionSummary[] }[] = [];
    filteredSessions.forEach((s) => {
      const my = formatMonthYear(s.startTime);
      let group = groups.find((g) => g.monthYear === my);
      if (!group) {
        group = { monthYear: my, items: [] };
        groups.push(group);
      }
      group.items.push(s);
    });
    return groups;
  }, [filteredSessions]);

  const handleStartQuickSession = () => {
    triggerHaptic("light");
    const sessionId = useSessionStore
      .getState()
      .startQuickSession("Quick Session");
    router.push(`/session/${sessionId}`);
  };

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 120,
        }}
      >
        {/* Top Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-[34px] font-bold tracking-[-0.5px]">
              Logbook
            </Text>
            <Text className="text-[#9A9AA6] text-[14px] mt-1">
              Your chronological session history
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic("light");
              router.push("/settings");
            }}
            className="w-[40px] h-[40px] bg-[#19191D] border border-[#27272F] rounded-xl items-center justify-center"
          >
            <SettingsIcon size={20} color="#9090A0" />
          </TouchableOpacity>
        </View>

        {/* 12-Week Consistency Heatmap */}
        <View className="mb-6">
          <ConsistencyLedger />
        </View>

        {/* Quick-Filter Strip */}
        <LogbookFilterStrip active={activeFilter} onChange={setActiveFilter} />

        {/* Sessions History Feed */}
        {sessions.length === 0 ? (
          <View className="min-h-[160px] border border-dashed border-[#27272F] bg-[#141417] rounded-xl flex-col items-center justify-center p-6">
            <Text className="text-[12px] font-bold text-[#555562] uppercase tracking-[1.2px]">
              NO SESSIONS RECORDED
            </Text>
            <Text className="text-[13px] text-[#8A8A98] text-center mt-2 mb-6">
              Your chronologically logged gym sessions, volume stats, and beta
              clips will populate here.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleStartQuickSession}
              className="h-[44px] bg-[#19191D] border border-[#8E7CFF] rounded-lg px-6 items-center justify-center"
            >
              <Text className="text-[13px] font-bold text-[#8E7CFF]">
                START QUICK SESSION
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View className="items-center py-10 gap-2">
            <Text className="text-[28px]">🔍</Text>
            <Text className="text-white text-[15px] font-bold">
              No sessions match this filter
            </Text>
            <Text className="text-[#8A8A98] text-[13px] text-center">
              Try selecting a different filter above
            </Text>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              onPress={handleStartQuickSession}
              activeOpacity={0.8}
              className="h-[44px] flex-row items-center justify-center bg-[#19191D] border border-[#27272F] rounded-lg mb-5 gap-2"
            >
              <Plus size={15} color="#8E7CFF" strokeWidth={2.5} />
              <Text className="text-white text-[13px] font-bold tracking-[0.6px]">
                NEW SESSION
              </Text>
            </TouchableOpacity>

            {sessionsByMonth.map((group) => (
              <View key={group.monthYear} className="mb-6">
                <Text className="text-[#8A8A98] text-[12px] font-bold tracking-[1.2px] mb-3 px-1">
                  {group.monthYear}
                </Text>

                <View className="bg-[#19191D] border border-[#27272F] rounded-xl overflow-hidden">
                  {group.items.map((s, idx) => (
                    <SessionHistoryCard
                      key={s.id}
                      session={s}
                      isLast={idx === group.items.length - 1}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
