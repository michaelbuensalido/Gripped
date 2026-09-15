import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  Settings as SettingsIcon,
} from "lucide-react-native";
import Svg, { Polygon, Path } from "react-native-svg";
import {
  THEME_COLORS,
  FLOATING_CARD_STYLE,
  FLOATING_CARD_HERO_STYLE,
} from "../constants/theme";
import { ScreenContainer } from "../components/ui/ScreenContainer";
import { getHomeStats, type HomeStats } from "../db/queries";
import { getAllRoutinesWithBlocks } from "../db/routineQueries";
import { GRADE_BY_LABEL } from "../constants/grades";
import { useSessionStore } from "../store/sessionStore";
import type { RoutineWithBlocks } from "../types";
import {
  RecommendedRouteCard,
  type RecommendedRoute,
} from "../components/home/RecommendedRouteCard";
import { RouteDetailModal } from "../components/home/RouteDetailModal";
import { triggerHaptic } from "../utils/haptics";

const RECOMMENDED_ROUTES: RecommendedRoute[] = [
  {
    id: "rec-1",
    title: "Ripple Effect",
    grade: "V6",
    image: require("../assets/holds-images/v6-ripple-effect-square.jpg"),
    holdType: "Sloper / Compression",
    angle: "35° Overhang",
  },
  {
    id: "rec-2",
    title: "Slab Rise",
    grade: "V5",
    image: require("../assets/holds-images/v5-slab-rise.png"),
    holdType: "Micro Crimp & Balance",
    angle: "10° Slab",
  },
  {
    id: "rec-3",
    title: "Kars Sloper",
    grade: "V7",
    image: require("../assets/holds-images/v7-kars-sloper.png"),
    holdType: "Wide Bulbous Pinch",
    angle: "45° Steep Wall",
  },
  {
    id: "rec-4",
    title: "Poly Edge",
    grade: "V8",
    image: require("../assets/holds-images/v8-poly-edge.png"),
    holdType: "Geometric Poly Edge",
    angle: "Roof / Cave",
  },
  {
    id: "rec-5",
    title: "Purple Bulb",
    grade: "V4",
    image: require("../assets/holds-images/v4-purple-sloper.png"),
    holdType: "Open-Hand Bulb",
    angle: "25° Overhang",
  },
  {
    id: "rec-6",
    title: "Yellow Pocket",
    grade: "V3",
    image: require("../assets/holds-images/v3-yellow-jug.png"),
    holdType: "Dual-Finger Pocket",
    angle: "Vertical Wall",
  },
];

/**
 * Solid rock/boulder glyph matching reference mockup
 */
function SolidBoulderIcon({
  size = 22,
  color = "#8A8A98",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points="4,15 7,6 15,3 21,8 20,18 8,21" fill={color} />
      <Path
        d="M 7 6 L 13 11 L 20 18 M 13 11 L 8 21"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.4"
        fill="none"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeSession = useSessionStore((s) => s.activeSession);
  const [homeStats, setHomeStats] = useState<HomeStats | null>(null);
  const [suggestedRoutine, setSuggestedRoutine] =
    useState<RoutineWithBlocks | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RecommendedRoute | null>(
    null
  );

  useFocusEffect(
    useCallback(() => {
      try {
        const stats = getHomeStats();
        setHomeStats(stats);
        const routines = getAllRoutinesWithBlocks();
        if (routines.length > 0) {
          setSuggestedRoutine(routines[0]);
        }
      } catch (err) {
        console.error("Failed to load home stats:", err);
      }
    }, [])
  );

  // Compute concise Grade Span for suggested routine
  const gradeList =
    suggestedRoutine?.blocks
      .flatMap((b) => b.boulders.map((bo) => bo.gradeRaw))
      .filter(Boolean) ?? [];

  const sortedGrades = Array.from(new Set(gradeList)).sort((a, b) => {
    const diffA = GRADE_BY_LABEL[a]?.difficulty ?? 0;
    const diffB = GRADE_BY_LABEL[b]?.difficulty ?? 0;
    return diffA - diffB;
  });

  let routineGradeSpan = "V4 – V7";
  if (sortedGrades.length === 1) {
    routineGradeSpan = sortedGrades[0];
  } else if (sortedGrades.length > 1) {
    routineGradeSpan = `${sortedGrades[0]} – ${sortedGrades[sortedGrades.length - 1]}`;
  }

  const hasActiveSession = Boolean(activeSession || homeStats?.activeSession);

  // Route Detail Actions
  const handleOpenRoute = (route: RecommendedRoute) => {
    setSelectedRoute(route);
  };

  const handleLogSend = (route: RecommendedRoute) => {
    setSelectedRoute(null);
    if (hasActiveSession && homeStats?.activeSession) {
      router.push(`/session/${homeStats.activeSession.id}`);
    } else {
      router.push("/session/new");
    }
  };

  const handleSaveProject = (route: RecommendedRoute) => {
    setSelectedRoute(null);
    Alert.alert(
      "Project Saved",
      `"${route.title}" (${route.grade}) has been added to your active projects.`
    );
  };

  const handleViewBeta = (route: RecommendedRoute) => {
    setSelectedRoute(null);
    router.push("/logbook");
  };

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 160,
        }}
      >
        {/* ── 1. Top User Bar ────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          {/* Left: Floating capsule container */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/settings")}
            style={{
              backgroundColor: THEME_COLORS.cardSurface,
              borderColor: THEME_COLORS.cardBorder,
              borderTopColor: "rgba(255, 255, 255, 0.14)",
              borderWidth: 1,
              borderRadius: 24,
              paddingVertical: 4,
              paddingLeft: 4,
              paddingRight: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 3,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderColor: "rgba(142, 124, 255, 0.7)",
                borderWidth: 1.5,
                shadowColor: "#8E7CFF",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 5,
                overflow: "hidden",
              }}
            >
              <Image
                source={require("../assets/maya_avatar.jpg")}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                resizeMode="cover"
              />
            </View>

            {/* Name */}
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Michael Buensalido
            </Text>

            <ChevronDown size={14} color="#8A8A98" />
          </TouchableOpacity>

          {/* Right actions: Settings gear + Circular bell button */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/settings")}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: THEME_COLORS.cardSurface,
                borderColor: THEME_COLORS.cardBorder,
                borderTopColor: "rgba(255, 255, 255, 0.14)",
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 3,
              }}
            >
              <SettingsIcon size={18} color="#9A9AA6" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: THEME_COLORS.cardSurface,
                borderColor: THEME_COLORS.cardBorder,
                borderTopColor: "rgba(255, 255, 255, 0.14)",
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 3,
              }}
            >
              <Bell size={18} color="#FFFFFF" />
              <View
                style={{
                  position: "absolute",
                  top: 2,
                  right: 3,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#8E7CFF",
                  borderWidth: 1.5,
                  borderColor: "#1E1E24",
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Greeting & Target Grade Sync ────────────────── */}
        <View style={{ marginTop: 18, marginBottom: 8 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: "700",
              letterSpacing: -0.5,
            }}
          >
            Keep climbing, Michael
          </Text>
        </View>

        {/* Grade Badge: V-Scale pill in Lime Green #6EE756 */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: "#6EE756",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 3.5,
              alignSelf: "flex-start",
              shadowColor: "#6EE756",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text
              style={{
                color: "#111115",
                fontSize: 14,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              {homeStats?.hardestSend ?? "V7"}
            </Text>
          </View>
        </View>

        {/* ── 3. Metric Strip Grammar & Contrast Cleanup ─────── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {/* Card 1: COMPLETED */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#1E1E24",
              borderWidth: 1,
              borderColor: "#2C2C35",
              borderRadius: 14,
              padding: 13,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "700" }}>
              {homeStats?.totalSends ?? 0}
            </Text>
            <Text
              style={{
                color: "#8A8A98",
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginTop: 4,
              }}
              className="uppercase"
            >
              COMPLETED
            </Text>
          </View>

          {/* Card 2: PROJECTS */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#1E1E24",
              borderWidth: 1,
              borderColor: "#2C2C35",
              borderRadius: 14,
              padding: 13,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "700" }}>
              {homeStats?.totalProjects ?? 3}
            </Text>
            <Text
              style={{
                color: "#8A8A98",
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginTop: 4,
              }}
              className="uppercase"
            >
              PROJECTS
            </Text>
          </View>

          {/* Card 3: FLASHES */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#1E1E24",
              borderWidth: 1,
              borderColor: "#2C2C35",
              borderRadius: 14,
              padding: 13,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "700" }}>
              {homeStats?.totalFlashes ?? 0}
            </Text>
            <Text
              style={{
                color: "#8A8A98",
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginTop: 4,
              }}
              className="uppercase"
            >
              FLASHES
            </Text>
          </View>
        </View>

        {/* ── 4. "Today's Session" Hero Card ─────────────────── */}
        <View
          style={[
            FLOATING_CARD_HERO_STYLE,
            {
              padding: 20,
              marginHorizontal: 0,
              marginTop: 0,
              marginBottom: 20,
            },
          ]}
        >
          {/* Header: Lavender label "TODAY'S SESSION" + 3-dot pagination */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: "#8E7CFF",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.2,
              }}
              className="uppercase"
            >
              {hasActiveSession ? "ACTIVE SESSION" : "TODAY'S SESSION"}
            </Text>

            {/* 3-dot pagination */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#8E7CFF",
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#2E2E36",
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#2E2E36",
                }}
              />
            </View>
          </View>

          {/* Route & Type */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              marginBottom: 6,
            }}
          >
            <SolidBoulderIcon size={22} color="#8A8A98" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: "700",
                letterSpacing: -0.5,
              }}
              numberOfLines={1}
            >
              {hasActiveSession
                ? homeStats?.activeSession?.gymName || "Climbing Session"
                : routineGradeSpan}
            </Text>
          </View>

          {/* Meta */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: "#9A9AA6",
                fontSize: 13,
                fontWeight: "500",
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {hasActiveSession
                ? "Session in progress • Log as you climb"
                : `${suggestedRoutine?.category ?? "Overhang"} • ${suggestedRoutine?.title ?? "Power Endurance"}`}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <Clock size={13} color="#9A9AA6" />
              <Text
                style={{
                  color: "#9A9AA6",
                  fontSize: 13,
                  fontWeight: "500",
                }}
              >
                {hasActiveSession
                  ? "Active"
                  : `Duration ${suggestedRoutine?.estimatedMinutes ?? 75} min`}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (hasActiveSession && homeStats?.activeSession) {
                router.push(`/session/${homeStats.activeSession.id}`);
              } else if (suggestedRoutine) {
                router.push({
                  pathname: "/session/new",
                  params: { routineId: suggestedRoutine.id },
                });
              } else {
                router.push("/session/new");
              }
            }}
            style={{
              backgroundColor: "#8E7CFF",
              height: 52,
              borderRadius: 26,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#8E7CFF",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              {hasActiveSession ? "RESUME SESSION" : "START SESSION"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Active Project Mini-Banner ───────────────────── */}
        <View style={{ marginBottom: 22 }}>
          <Text
            style={{
              color: "#8A8A98",
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.2,
              marginBottom: 8,
            }}
            className="uppercase"
          >
            CURRENT PROJECT
          </Text>

          <Pressable
            onPress={() => {
              triggerHaptic("light");
              if (hasActiveSession && homeStats?.activeSession) {
                router.push(`/session/${homeStats.activeSession.id}`);
              } else {
                router.push("/session/new");
              }
            }}
            style={({ pressed }) => ({
              backgroundColor: "#1E1E24",
              borderWidth: 1,
              borderColor: "#2C2C35",
              borderRadius: 16,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            {/* Left: V-grade badge */}
            <View
              style={{
                backgroundColor: "#17171C",
                borderWidth: 1,
                borderColor: "#8E7CFF",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  color: "#8E7CFF",
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {homeStats?.activeProject?.grade ?? "V7"}
              </Text>
            </View>

            {/* Center: Project name & burns */}
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {homeStats?.activeProject
                  ? `${homeStats.activeProject.title} • ${homeStats.activeProject.burns} Burns logged`
                  : "Cave Roof Project • 4 Burns logged"}
              </Text>
            </View>

            {/* Right: Action chevron */}
            <ChevronRight size={18} color="#5A5A65" />
          </Pressable>
        </View>

        {/* ── 6. Recommended Routes Carousel ─────────────────── */}
        <View style={{ marginBottom: 12 }}>
          {/* Section Header */}
          <Text
            style={{
              color: "#8A8A98",
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.2,
              marginBottom: 12,
            }}
            className="uppercase"
          >
            RECOMMENDED ROUTES
          </Text>

          {/* Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            style={{ marginHorizontal: -16, paddingLeft: 16 }}
          >
            {RECOMMENDED_ROUTES.map((route) => (
              <RecommendedRouteCard
                key={route.id}
                route={route}
                onPress={handleOpenRoute}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* ── Route Detail Quick Actions Bottom Sheet ──────────── */}
      <RouteDetailModal
        visible={Boolean(selectedRoute)}
        route={selectedRoute}
        onClose={() => setSelectedRoute(null)}
        onLogSend={handleLogSend}
        onSaveProject={handleSaveProject}
        onViewBeta={handleViewBeta}
      />
    </ScreenContainer>
  );
}
