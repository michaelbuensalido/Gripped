import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  Edit2,
  Archive,
  RotateCcw,
  AlertCircle,
  Crosshair,
  Trash2,
  Plus,
  Minus,
} from "lucide-react-native";
import Svg, { Line } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import { usePreferences } from "../../utils/preferences";
import { Chip } from "../../components/ui/Chip";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import { ScalePressable } from "../../components/ui/ScalePressable";
import { EmptyState } from "../../components/ui/EmptyState";
import { BetaSection } from "../../components/project/BetaSection";
import { ProjectShareCardModal } from "../../components/project/ProjectShareCardModal";
import { useProject, useProjectHistory, useActiveSession, useProjectBetas, useBetaMoves } from "../../db/hooks";
import {
  updateProjectStatus,
  deleteProject,
  updateProjectBeta,
  updateProjectTopoAndMoves,
} from "../../db/queries";
import { triggerHaptic } from "../../utils/haptics";
import { useSessionStore } from "../../store/sessionStore";
import { getActiveSession } from "../../db/queries";
import { LogSheet } from "../../components/session/LogSheet";
import { UndoToast } from "../../components/ui/UndoToast";
import { ResultType } from "../../components/ui/ResultChip";
import { useCelebration } from "../../components/celebration/CelebrationProvider";

type TopoHoldType = "start" | "hand" | "crux" | "finish";

interface TopoMarker {
  id: string;
  xPct: number;
  yPct: number;
  type: TopoHoldType;
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, space, type, radius } = useTheme();
  const { formatGradeLabel } = usePreferences();
  const insets = useSafeAreaInsets();
  const { triggerBig } = useCelebration();

  const project = useProject(id as string);
  const history = useProjectHistory(id as string);
  const activeSession = useActiveSession();
  const betas = useProjectBetas((id as string) || "");
  const currentBeta = betas.find(b => b.isCurrent) || betas[0] || null;
  const moves = useBetaMoves(currentBeta?.id || null);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Topo state
  const [isEditingTopo, setIsEditingTopo] = useState(false);
  const [activeHoldType, setActiveHoldType] = useState<TopoHoldType>("hand");
  const [wallSize, setWallSize] = useState({ width: 360, height: 520 });

  if (!project) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, space.lg),
          paddingHorizontal: space.lg,
        }}
      >
        <ScalePressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to projects"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.lg,
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </ScalePressable>
        <EmptyState
          asCard
          icon={<AlertCircle size={28} color={colors.textMuted} />}
          title="Project Not Found"
          body="This project may have been deleted or does not exist."
          cta={
            <PrimaryButton
              label="BACK TO PROJECTS"
              onPress={() => router.replace('/projects')}
            />
          }
        />
      </View>
    );
  }

  const displayTitle = project.title;
  const rawGrade = project.gradeRaw || "V6";
  const displayGrade = formatGradeLabel(rawGrade);
  const displayStyle =
    project?.wallAngle && project?.holdType
      ? `${project.wallAngle.charAt(0).toUpperCase() + project.wallAngle.slice(1)} • ${project.holdType.charAt(0).toUpperCase() + project.holdType.slice(1)}`
      : "Overhang • Power endurance";

  const hasPriorAttempts = (project?.attempts || 0) > 0 || (history && history.length > 0);
  const topoMarkers: TopoMarker[] = Array.isArray(project?.annotations) ? project.annotations : [];

  const getHoldColor = (holdType: TopoHoldType) => {
    switch (holdType) {
      case "start":
        return colors.flash;
      case "crux":
        return colors.danger;
      case "finish":
        return colors.accent;
      case "hand":
      default:
        return colors.top;
    }
  };

  const handleWallLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setWallSize({ width, height });
    }
  };

  const handleWallTap = (e: any) => {
    if (!isEditingTopo || !project) return;
    const { locationX, locationY } = e.nativeEvent;
    if (!wallSize.width || !wallSize.height) return;
    const xPct = Math.max(0.05, Math.min(0.95, locationX / wallSize.width));
    const yPct = Math.max(0.14, Math.min(0.84, locationY / wallSize.height));

    triggerHaptic("selection");
    const newMarker: TopoMarker = {
      id: `hold_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      xPct,
      yPct,
      type: activeHoldType,
    };
    const next = [...topoMarkers, newMarker];
    updateProjectTopoAndMoves(project.id, { annotations: next });
  };

  const handleRemoveMarker = (markerId: string) => {
    if (!isEditingTopo || !project) return;
    triggerHaptic("light");
    const next = topoMarkers.filter((m) => m.id !== markerId);
    updateProjectTopoAndMoves(project.id, { annotations: next });
  };

  const handleClearTopo = () => {
    if (!project) return;
    triggerHaptic("medium");
    updateProjectTopoAndMoves(project.id, { annotations: [] });
  };

  const handleAdjustTotalMoves = (delta: number) => {
    if (!project) return;
    triggerHaptic("selection");
    const currentTotal = project.totalMoves || Math.max(project.highWaterMarkMoves || 6, 6);
    const nextTotal = Math.max(1, currentTotal + delta);
    updateProjectTopoAndMoves(project.id, { totalMoves: nextTotal });
  };

  const handleAdjustHighWaterMark = (delta: number) => {
    if (!project) return;
    triggerHaptic("selection");
    const currentHwm = project.highWaterMarkMoves || 0;
    const maxAllowed = project.totalMoves ? project.totalMoves : 50;
    const nextHwm = Math.max(0, Math.min(maxAllowed, currentHwm + delta));
    updateProjectTopoAndMoves(project.id, { highWaterMarkMoves: nextHwm });
  };

  const handleLogAttempt = () => {
    triggerHaptic("medium");
    setIsLogModalOpen(true);
  };

  const handleSaveAttempt = (
    grade: string,
    result: ResultType,
    attempts: number,
    notes: string,
    wallAngle?: string | null,
    holdType?: string | null
  ) => {
    triggerHaptic("medium");
    if (!project) return;

    const state = useSessionStore.getState();
    let session = getActiveSession();
    if (!session) {
      state.startQuickSession(project.gymName || "Local Gym");
    }

    let finalOutcome = result === "top" ? "send" : result;
    if (finalOutcome === "flash" && (hasPriorAttempts || attempts > 1)) {
      finalOutcome = "send";
    }

    state.logGenericAscent({
      gradeRaw: project.gradeRaw,
      outcome: finalOutcome,
      movesLinked: attempts,
      notes,
      projectId: project.id,
      wallAngle: wallAngle ?? project.wallAngle,
      holdType: holdType ?? project.holdType,
    });

    setIsLogModalOpen(false);

    if (result === "top" || result === "flash") {
      triggerBig({
        nickname: project.title,
        gradeRaw: displayGrade,
        burns: (project.attempts || 0) + attempts,
        sessions: (history?.length || 0) + 1,
      });
      setToastMessage("Project sent! Congratulations!");
    } else {
      triggerHaptic("success");
      setToastMessage(`Attempt logged (${attempts} burn${attempts > 1 ? "s" : ""})`);
    }
  };

  const handleUndo = () => {
    triggerHaptic("light");
    useSessionStore.getState().undoLastClimb();
    setToastMessage(null);
  };

  const handleMarkSent = () => {
    triggerHaptic("success");
    if (project) updateProjectStatus(project.id, "sent");
    router.back();
  };

  const handleArchive = () => {
    triggerHaptic("medium");
    if (project) updateProjectStatus(project.id, "abandoned");
    setShowMenu(false);
    router.back();
  };

  const handleRestore = () => {
    triggerHaptic("success");
    if (project) {
      updateProjectStatus(project.id, "in_progress");
      setToastMessage("Project restored to active");
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert("Delete Project", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          triggerHaptic("heavy");
          if (project) deleteProject(project.id);
          router.back();
        },
      },
    ]);
  };

  const handleSaveNotes = () => {
    if (project) updateProjectBeta(project.id, notesDraft.trim() || null);
    setIsEditingNotes(false);
  };

  const hwm = project?.highWaterMarkMoves || 0;
  const totalMoves = project?.totalMoves || 0;
  const moveProgressPct =
    project?.status === "sent"
      ? 100
      : totalMoves > 0
      ? Math.min(100, Math.round((hwm / totalMoves) * 100))
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* 1. Full Hero Wall View with Real Climbing Wall Photo & Interactive Topo Overlays */}
        <View
          onLayout={handleWallLayout}
          style={{ height: 520, width: "100%", position: "relative" }}
        >
          <ImageBackground
            source={
              project?.mediaUri
                ? { uri: project.mediaUri }
                : project?.wallAngle === "overhang" ||
                    project?.wallAngle === "roof" ||
                    (project?.normalizedDifficulty ?? project?.grade_index ?? 0) >= 6
                  ? require("../../assets/covers/cover-overhang.jpg")
                  : require("../../assets/covers/cover-slab.jpg")
            }
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          >
            {/* Subtle top vignette for crisp white header controls */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 120,
                backgroundColor: "rgba(15, 23, 42, 0.35)",
              }}
            />

            {/* Interactive Topo Canvas Layer */}
            <Pressable
              disabled={!isEditingTopo}
              onPress={handleWallTap}
              style={StyleSheet.absoluteFill}
            >
              {/* Connecting Route Line SVG */}
              {topoMarkers.length > 1 && (
                <Svg
                  width={wallSize.width}
                  height={wallSize.height}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                >
                  {topoMarkers.slice(0, -1).map((m, idx) => {
                    const next = topoMarkers[idx + 1];
                    return (
                      <Line
                        key={`${m.id}_${next.id}`}
                        x1={m.xPct * wallSize.width}
                        y1={m.yPct * wallSize.height}
                        x2={next.xPct * wallSize.width}
                        y2={next.yPct * wallSize.height}
                        stroke={colors.textWhitePrimary}
                        strokeOpacity={0.85}
                        strokeWidth={2.5}
                        strokeDasharray="6, 6"
                      />
                    );
                  })}
                </Svg>
              )}

              {/* Hold Markers */}
              {topoMarkers.map((marker, idx) => {
                const holdColor = getHoldColor(marker.type);
                const left = marker.xPct * wallSize.width - 18;
                const top = marker.yPct * wallSize.height - 18;
                return (
                  <Pressable
                    key={marker.id}
                    onPress={() => handleRemoveMarker(marker.id)}
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 3,
                      borderColor: holdColor,
                      backgroundColor: "rgba(15, 23, 42, 0.65)",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: holdColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textWhitePrimary,
                        fontSize: 11,
                        fontWeight: "800",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {marker.type === "start"
                        ? "S"
                        : marker.type === "finish"
                        ? "F"
                        : marker.type === "crux"
                        ? "★"
                        : idx + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </Pressable>

            {/* Top Navigation Bar overlaid on wall */}
            <View
              style={{
                paddingTop: Math.max(insets.top, 20) + 6,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 20,
              }}
            >
              {/* Back Button Circle */}
              <ScalePressable
                onPress={() => router.back()}
                haptic="light"
                activeScale={0.92}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(15, 23, 42, 0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.22)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={22} color={colors.textWhitePrimary} />
              </ScalePressable>

              {/* Title & Subtitle in Center */}
              <View style={{ alignItems: "center", flex: 1, paddingHorizontal: 12 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: colors.textWhitePrimary,
                    fontSize: 17,
                    fontWeight: "700",
                    fontFamily: type.heading.fontFamily,
                  }}
                >
                  {displayTitle} ({displayGrade})
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: "rgba(255, 255, 255, 0.80)",
                    fontSize: 12,
                    marginTop: 2,
                    fontFamily: type.caption.fontFamily,
                  }}
                >
                  {displayStyle}
                </Text>
              </View>

              {/* More Menu Circle */}
              <ScalePressable
                onPress={() => setShowMenu(!showMenu)}
                haptic="light"
                activeScale={0.92}
                accessibilityRole="button"
                accessibilityLabel="More options"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(15, 23, 42, 0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.22)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MoreHorizontal size={22} color={colors.textWhitePrimary} />
              </ScalePressable>
            </View>

            {/* Interactive Route Topo Controls Bar (Bottom of Hero Wall, above sheet overlap) */}
            <View
              style={{
                position: "absolute",
                bottom: 42,
                left: 20,
                right: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 25,
              }}
            >
              {isEditingTopo ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(15, 23, 42, 0.82)",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {(
                    [
                      { key: "start", label: "Start", color: colors.flash },
                      { key: "hand", label: "Hold", color: colors.top },
                      { key: "crux", label: "Crux", color: colors.danger },
                      { key: "finish", label: "Top", color: colors.accent },
                    ] as const
                  ).map((h) => {
                    const selected = activeHoldType === h.key;
                    return (
                      <Pressable
                        key={h.key}
                        onPress={() => {
                          triggerHaptic("selection");
                          setActiveHoldType(h.key);
                        }}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: radius.pill,
                          backgroundColor: selected ? h.color : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: colors.textWhitePrimary,
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          {h.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {topoMarkers.length > 0 && (
                    <Pressable
                      onPress={handleClearTopo}
                      hitSlop={8}
                      style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </Pressable>
                  )}
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.60)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.16)",
                  }}
                >
                  <Text style={{ color: colors.textWhitePrimary, fontSize: 11, fontWeight: "600" }}>
                    {topoMarkers.length > 0
                      ? `${topoMarkers.length} topo holds marked`
                      : "Tap Edit Topo to map holds"}
                  </Text>
                </View>
              )}

              <ScalePressable
                haptic="selection"
                activeScale={0.94}
                onPress={() => setIsEditingTopo(!isEditingTopo)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: isEditingTopo ? colors.accent : "rgba(15, 23, 42, 0.72)",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.24)",
                }}
              >
                <Crosshair size={14} color={colors.textWhitePrimary} />
                <Text style={{ color: colors.textWhitePrimary, fontSize: 12, fontWeight: "700" }}>
                  {isEditingTopo ? "Done" : "Edit Topo"}
                </Text>
              </ScalePressable>
            </View>

            {/* Menu Popup */}
            {showMenu && (
              <View
                style={{
                  position: "absolute",
                  top: Math.max(insets.top, 20) + 54,
                  right: 20,
                  backgroundColor: colors.card,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  zIndex: 100,
                  overflow: "hidden",
                  width: 180,
                }}
              >
                {project?.status !== "sent" && (
                  <TouchableOpacity
                    onPress={handleMarkSent}
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      Mark as sent
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setShowMenu(false);
                    setIsShareOpen(true);
                  }}
                  style={{
                    padding: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                    Share card
                  </Text>
                </TouchableOpacity>
                {project?.status === "abandoned" ? (
                  <TouchableOpacity
                    onPress={handleRestore}
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                      Restore to active
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleArchive}
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14 }}>
                      Archive
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleDelete}
                  style={{ padding: 14 }}
                >
                  <Text style={{ color: colors.dangerText, fontSize: 14, fontWeight: "600" }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ImageBackground>
        </View>

        {/* 2. Overlapping Spatial Chalk & Glass Sheet */}
        <View
          style={{
            marginTop: -28,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 20,
            paddingTop: 14,
          }}
        >
          {/* Subtle Sheet Grab Pill */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          {/* Archived Banner if abandoned */}
          {project?.status === "abandoned" && (
            <View
              style={{
                marginBottom: 16,
                padding: 16,
                borderRadius: radius.md,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <Archive size={20} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>
                    Archived Project
                  </Text>
                  <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                    This project is archived and hidden from your active hit-list.
                  </Text>
                </View>
              </View>
              <ScalePressable
                onPress={handleRestore}
                haptic="medium"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  minHeight: 44,
                  backgroundColor: colors.accent,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="Restore project"
              >
                <Text style={[type.control, { color: colors.textOnAccent, fontWeight: "600" }]}>
                  Restore
                </Text>
              </ScalePressable>
            </View>
          )}

          {/* Wall Angle & Hold Type Tags */}
          {(project?.wallAngle || project?.holdType || project?.gymName) && (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              {project?.gymName && <Chip label={project.gymName} />}
              {project?.wallAngle && <Chip label={project.wallAngle} />}
              {project?.holdType && <Chip label={project.holdType} />}
            </View>
          )}

          {/* Bento Stats Row: TOTAL BURNS & HIGH-WATER MARK */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                maxFontSizeMultiplier={1.3}
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  fontWeight: "700",
                }}
              >
                TOTAL BURNS
              </Text>
              <Text
                maxFontSizeMultiplier={1.3}
                style={{
                  color: colors.text,
                  fontSize: 28,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                  marginTop: 4,
                }}
              >
                {project?.attempts || 0}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  maxFontSizeMultiplier={1.3}
                  style={{
                    color: colors.textMuted,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  HIGH-WATER MARK
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <Text
                  maxFontSizeMultiplier={1.3}
                  style={{
                    color: colors.text,
                    fontSize: 28,
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {hwm}
                  {totalMoves > 0 ? (
                    <Text style={{ fontSize: 15, color: colors.textMuted, fontWeight: "600" }}>
                      {` / ${totalMoves}`}
                    </Text>
                  ) : null}
                </Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <ScalePressable
                    haptic="selection"
                    onPress={() => handleAdjustHighWaterMark(-1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.cardMuted,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Minus size={14} color={colors.text} />
                  </ScalePressable>
                  <ScalePressable
                    haptic="selection"
                    onPress={() => handleAdjustHighWaterMark(1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.accentSoft,
                      borderWidth: 1,
                      borderColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={14} color={colors.accent} />
                  </ScalePressable>
                </View>
              </View>
            </View>
          </View>

          {/* Move-Linking Progress Bar Card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  MOVE LINKING PROGRESS
                </Text>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 2 }}>
                  {totalMoves > 0
                    ? `${hwm} of ${totalMoves} moves linked (${moveProgressPct}%)`
                    : "Set total moves on this boulder to track progress"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <ScalePressable
                  haptic="selection"
                  onPress={() => handleAdjustTotalMoves(-1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.cardMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={13} color={colors.textMuted} />
                </ScalePressable>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                    minWidth: 52,
                    textAlign: "center",
                  }}
                >
                  {totalMoves > 0 ? `${totalMoves} moves` : "Set Goal"}
                </Text>
                <ScalePressable
                  haptic="selection"
                  onPress={() => handleAdjustTotalMoves(1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.cardMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={13} color={colors.text} />
                </ScalePressable>
              </View>
            </View>

            <View
              style={{
                height: 8,
                borderRadius: radius.pill,
                backgroundColor: colors.cardMuted,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${moveProgressPct}%`,
                  height: "100%",
                  borderRadius: radius.pill,
                  backgroundColor:
                    moveProgressPct >= 100 ? colors.flash : colors.accent,
                }}
              />
            </View>
          </View>

          <BetaSection projectId={id as string} />

          {/* Notes Section */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                NOTES
              </Text>
              {!isEditingNotes && (
                <TouchableOpacity
                  onPress={() => {
                    setNotesDraft(project?.microBeta || "");
                    setIsEditingNotes(true);
                  }}
                >
                  <Edit2 size={16} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>

            {isEditingNotes ? (
              <View>
                <TextInput
                  value={notesDraft}
                  onChangeText={setNotesDraft}
                  multiline
                  placeholder="Add notes..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    color: colors.text,
                    backgroundColor: colors.cardMuted,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 12,
                    fontSize: 14,
                    minHeight: 80,
                    marginBottom: 12,
                  }}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <SecondaryButton
                    label="Cancel"
                    onPress={() => setIsEditingNotes(false)}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    label="Save Note"
                    onPress={handleSaveNotes}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setNotesDraft(project?.microBeta || "");
                  setIsEditingNotes(true);
                }}
              >
                {project?.microBeta ? (
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {project.microBeta}
                  </Text>
                ) : (
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontStyle: "italic",
                      fontSize: 14,
                    }}
                  >
                    Tap to add notes...
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* History Section */}
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            HISTORY
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 28,
            }}
          >
            {history.length > 0 ? (
              history.map((h: any, idx: number) => (
                <View
                  key={h.sessionId}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: idx === history.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      maxFontSizeMultiplier={1.3}
                      style={{
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {new Date(h.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    {h.bestResult === "send" && (
                      <Text
                        maxFontSizeMultiplier={1.3}
                        style={{
                          color: colors.flashText,
                          fontSize: 12,
                          fontWeight: "700",
                          marginTop: 2,
                        }}
                      >
                        Sent!
                      </Text>
                    )}
                  </View>
                  <Text
                    maxFontSizeMultiplier={1.3}
                    style={{ color: colors.textMuted, fontSize: 13 }}
                  >
                    {h.burns} burn{h.burns > 1 ? "s" : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  textAlign: "center",
                  paddingVertical: 10,
                }}
              >
                No attempts logged yet.
              </Text>
            )}
          </View>

          {/* Active Session Info Banner if running */}
          {activeSession && (
            <ScalePressable
              haptic="light"
              activeScale={0.98}
              onPress={() => router.push("/session/active")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.cardMuted,
                borderRadius: radius.md,
                paddingHorizontal: space.md,
                paddingVertical: space.sm + 2,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: space.sm,
                minHeight: 44,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.flash }} />
                <Text style={[type.caption, { color: colors.text, fontWeight: "500" }]}>
                  Logging to {activeSession.gymName || "Session"}
                </Text>
              </View>
              <Text style={[type.caption, { color: colors.accentText, fontWeight: "600" }]}>
                View session →
              </Text>
            </ScalePressable>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            {project?.status === "abandoned" ? (
              <PrimaryButton
                label="RESTORE PROJECT TO ACTIVE"
                icon={<RotateCcw size={20} color={colors.textOnAccent} />}
                onPress={handleRestore}
              />
            ) : project?.status !== "sent" ? (
              <>
                <PrimaryButton
                  label="LOG ATTEMPT"
                  icon={<Sparkles size={20} color={colors.textOnAccent} />}
                  onPress={handleLogAttempt}
                />

                <SecondaryButton
                  label="MARK AS SENT"
                  variant="muted"
                  onPress={handleMarkSent}
                />
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* In-Project Log Sheet */}
      <LogSheet
        visible={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveAttempt}
        initialGrade={rawGrade}
        lockGrade={true}
        disableFlash={hasPriorAttempts}
        initialResult="attempt"
        initialAttempts={1}
        initialNotes=""
        initialWallAngle={project?.wallAngle}
        initialHoldType={project?.holdType}
        title={`Log Attempt • ${displayTitle}`}
      />

      {/* Feedback Toast with Undo */}
      <UndoToast
        visible={Boolean(toastMessage)}
        message={toastMessage || ""}
        onUndo={handleUndo}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Share Card Modal */}
      {project && (
        <ProjectShareCardModal
          visible={isShareOpen}
          project={project}
          beta={currentBeta}
          moves={moves}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </View>
  );
}

