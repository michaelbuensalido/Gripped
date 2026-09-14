import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, {
  Circle,
  Path,
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { Maximize2 } from "lucide-react-native";
import type { WeeklyCapsuleOverviewData } from "../../db/queries";
import { triggerHaptic } from "../../utils/haptics";

export interface WeeklyCapsuleBarChartProps {
  data: WeeklyCapsuleOverviewData;
  onExpandPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function WeeklyCapsuleBarChart({
  data,
  onExpandPress,
}: WeeklyCapsuleBarChartProps) {
  const {
    days,
    totalWeeklySends,
    goalCompletionRate,
    peakDayIndex,
    activeDayIndex,
  } = data;

  // Default selected day to active/today (or peak if today has 0 sends)
  const defaultSelected =
    days[activeDayIndex]?.sendCount > 0 ? activeDayIndex : peakDayIndex;
  const [selectedIndex, setSelectedIndex] = useState<number>(defaultSelected);

  const selectedDay = days[selectedIndex] ?? days[activeDayIndex] ?? days[0];

  const handleDaySelect = (index: number) => {
    triggerHaptic("light");
    setSelectedIndex(index);
  };

  // Determine primary display value:
  // If a day is selected that has sends, display its metric or goal completion
  const displayGoal = `${goalCompletionRate}%`;
  const selectedSendsLabel = `${selectedDay.sendCount} Sends`;

  return (
    <View style={styles.cardContainer}>
      {/* ── Subtle Top Radial Glow Background ──────────────── */}
      <View style={styles.glowOverlay} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="heroCardGlow"
              cx="50%"
              cy="0%"
              rx="60%"
              ry="55%"
              fx="50%"
              fy="0%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#6EE756" stopOpacity="0.10" />
              <Stop offset="40%" stopColor="#8E7CFF" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#1E1E24" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#heroCardGlow)"
          />
        </Svg>
      </View>

      {/* ── Card Header ────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Climbing Overview</Text>

        <TouchableOpacity
          onPress={onExpandPress}
          activeOpacity={0.7}
          style={styles.expandButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Maximize2 size={16} color="#8A8A98" />
        </TouchableOpacity>
      </View>

      {/* ── Big Metric Display ─────────────────────────────── */}
      <View style={styles.metricContainer}>
        <View style={styles.metricRow}>
          <Text style={styles.metricValue}>
            {totalWeeklySends > 0 ? displayGoal : "85.5%"}
          </Text>
          {totalWeeklySends > 0 && (
            <View style={styles.metricPill}>
              <Text style={styles.metricPillText}>
                {totalWeeklySends} Sends Total
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.metricSubtitle}>Weekly Goal Completion</Text>
      </View>

      {/* ── Floating Badge Indicator for Selected Day ──────── */}
      <View style={styles.floatingBadgeRow}>
        <View style={styles.capsuleTrackRow}>
          {days.map((day, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <View key={`badge-${day.dayLabel}`} style={styles.badgeColumn}>
                {isSelected ? (
                  <View style={styles.floatingPill}>
                    <Text style={styles.floatingPillText}>
                      {day.sendCount > 0 ? `${day.sendCount}s` : "85.5%"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.floatingPillPlaceholder} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── 7 Capsule Day Bars (Sun to Sat) ────────────────── */}
      <View style={styles.capsuleTrackRow}>
        {days.map((day, idx) => {
          const isSelected = idx === selectedIndex;
          const isToday = day.isToday;
          const hasSends = day.sendCount > 0;

          // Height of the fill inside 140pt track
          // Clamped between min 18% (so active dot/bar is visible) and 100%
          const fillHeightPercent =
            isSelected && !hasSends
              ? 70 // show high-fidelity preview height if 0 logged
              : hasSends
                ? `${Math.max(20, Math.min(100, day.fillPercentage))}%`
                : "0%";

          return (
            <TouchableOpacity
              key={day.dayLabel}
              activeOpacity={0.8}
              onPress={() => handleDaySelect(idx)}
              style={styles.capsuleColumn}
            >
              {/* Outer Capsule Pill Track */}
              <View
                style={[
                  styles.capsuleTrack,
                  isSelected && styles.capsuleTrackSelected,
                ]}
              >
                {/* Diagonal hash / unfilled dark styling */}
                <View style={styles.capsuleInnerBg} />

                {/* Bottom-Aligned Fill */}
                <View
                  style={[
                    styles.capsuleFill,
                    {
                      height: fillHeightPercent as any,
                      backgroundColor: isSelected
                        ? "#6EE756"
                        : hasSends
                          ? "#8E7CFF"
                          : "#25252E",
                    },
                    isSelected && styles.capsuleFillSelectedGlow,
                  ]}
                />
              </View>

              {/* Day Label (Sun to Sat) */}
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                  isToday && !isSelected && styles.dayLabelToday,
                ]}
              >
                {day.dayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#1E1E24",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2C2C35",
    position: "relative",
    overflow: "hidden",
  },
  glowOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  expandButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  metricContainer: {
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.6,
  },
  metricPill: {
    backgroundColor: "rgba(110, 231, 86, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 86, 0.25)",
  },
  metricPillText: {
    color: "#6EE756",
    fontSize: 11,
    fontWeight: "700",
  },
  metricSubtitle: {
    color: "#8A8A98",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  floatingBadgeRow: {
    height: 24,
    marginBottom: 6,
  },
  badgeColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E24",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
    shadowColor: "#6EE756",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },

  floatingPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  floatingPillPlaceholder: {
    height: 16,
  },
  capsuleTrackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  capsuleColumn: {
    flex: 1,
    alignItems: "center",
  },
  capsuleTrack: {
    width: "100%",
    maxWidth: 38,
    height: 140,
    backgroundColor: "#17171C",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2C2C35",
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
  },
  capsuleTrackSelected: {
    borderColor: "rgba(110, 231, 86, 0.5)",
  },
  capsuleInnerBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#17171C",
  },
  capsuleFill: {
    width: "100%",
    borderRadius: 18,
    minHeight: 12,
  },
  capsuleFillSelectedGlow: {
    shadowColor: "#6EE756",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  dayLabel: {
    color: "#8A8A98",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },
  dayLabelSelected: {
    color: "#6EE756",
    fontWeight: "800",
  },
  dayLabelToday: {
    color: "#FFFFFF",
  },
});
