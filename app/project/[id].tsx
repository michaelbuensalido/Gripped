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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  Hand,
  Edit2,
  CheckCircle2,
  Archive,
  RotateCcw,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import { Chip } from "../../components/ui/Chip";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import { ScalePressable } from "../../components/ui/ScalePressable";
import { BetaSection } from "../../components/project/BetaSection";
import { useProject, useProjectHistory, useActiveSession } from "../../db/hooks";
import {
  updateProjectStatus,
  deleteProject,
  updateProjectBeta,
} from "../../db/queries";
import { triggerHaptic } from "../../utils/haptics";
import { useSessionStore } from "../../store/sessionStore";
import { getActiveSession } from "../../db/queries";
import { LogSheet } from "../../components/session/LogSheet";
import { UndoToast } from "../../components/ui/UndoToast";
import { ResultType } from "../../components/ui/ResultChip";
import { useCelebration } from "../../components/celebration/CelebrationProvider";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, space, type, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { triggerBig } = useCelebration();

  const project = useProject(id as string);
  const history = useProjectHistory(id as string);
  const activeSession = useActiveSession();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayTitle = project?.title || "Ripple Effect";
  const displayGrade = project?.gradeRaw || "V6";
  const displayStyle =
    project?.wallAngle && project?.holdType
      ? `${project.wallAngle.charAt(0).toUpperCase() + project.wallAngle.slice(1)} • ${project.holdType.charAt(0).toUpperCase() + project.holdType.slice(1)}`
      : "Overhang • Power endurance";

  const hasPriorAttempts = (project?.attempts || 0) > 0 || (history && history.length > 0);

  const handleLogAttempt = () => {
    triggerHaptic("medium");
    setIsLogModalOpen(true);
  };

  const handleSaveAttempt = (
    grade: string,
    result: ResultType,
    attempts: number,
    notes: string
  ) => {
    triggerHaptic("medium");
    if (!project) return;

    const state = useSessionStore.getState();
    let session = getActiveSession();
    if (!session) {
      state.startQuickSession(project.gymName || "Local Gym");
    }

    state.logGenericAscent({
      gradeRaw: project.gradeRaw,
      outcome: result === "top" ? "send" : result,
      movesLinked: attempts,
      notes,
      projectId: project.id,
      wallAngle: project.wallAngle,
      holdType: project.holdType,
    });

    setIsLogModalOpen(false);

    if (result === "top" || result === "flash") {
      triggerBig({
        nickname: project.title,
        gradeRaw: project.gradeRaw,
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* 1. Full Hero Wall View with Real Climbing Wall Photo & Interactive Overlays */}
        <View style={{ height: 560, width: "100%", position: "relative" }}>
          <ImageBackground
            source={
              project?.mediaUri
                ? { uri: project.mediaUri }
                : require("../../assets/holds-images/v6-ripple-effect-square.png")
            }
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          >
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
                  backgroundColor: "rgba(0, 0, 0, 0.45)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={22} color={colors.text} />
              </ScalePressable>

              {/* Title & Subtitle in Center */}
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "700",
                    fontFamily: type.heading.fontFamily,
                  }}
                >
                  {displayTitle} ({displayGrade})
                </Text>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.65)",
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
                  backgroundColor: "rgba(0, 0, 0, 0.45)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MoreHorizontal size={22} color={colors.text} />
              </ScalePressable>
            </View>

            {/* Menu Popup */}
            {showMenu && (
              <View
                style={{
                  position: "absolute",
                  top: Math.max(insets.top, 20) + 54,
                  right: 20,
                  backgroundColor: "rgba(24, 24, 34, 0.95)",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  zIndex: 100,
                  overflow: "hidden",
                  width: 170,
                }}
              >
                {project?.status !== "sent" && (
                  <TouchableOpacity
                    onPress={handleMarkSent}
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: "rgba(255, 255, 255, 0.08)",
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
                {project?.status === "abandoned" ? (
                  <TouchableOpacity
                    onPress={handleRestore}
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: "rgba(255, 255, 255, 0.08)",
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
                      borderBottomColor: "rgba(255, 255, 255, 0.08)",
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
                  <Text style={{ color: colors.dangerText, fontSize: 14 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

          </ImageBackground>
        </View>

        {/* Archived Banner if abandoned */}
        {project?.status === "abandoned" && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              padding: 16,
              borderRadius: radius.md,
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.12)",
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

        {/* 2. Telemetry Bento Strip & All Original Sections below wall */}
        <View style={{ paddingHorizontal: 20, paddingTop: project?.status === "abandoned" ? 14 : 20 }}>
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
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(22, 22, 30, 0.85)",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.45)",
                  fontSize: 10,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                TOTAL BURNS
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 26,
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
                backgroundColor: "rgba(22, 22, 30, 0.85)",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.45)",
                  fontSize: 10,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                HIGH-WATER MARK
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 26,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                  marginTop: 4,
                }}
              >
                {project?.highWaterMarkMoves
                  ? `${project.highWaterMarkMoves}`
                  : "0"}
              </Text>
            </View>
          </View>

          <BetaSection projectId={id as string} />

          {/* Notes Section */}
          <View
            style={{
              backgroundColor: "rgba(22, 22, 30, 0.85)",
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.06)",
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
                  color: "rgba(255, 255, 255, 0.45)",
                  fontSize: 11,
                  fontWeight: "600",
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
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={{
                    color: colors.text,
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    borderRadius: 12,
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
                      color: "rgba(255, 255, 255, 0.85)",
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {project.microBeta}
                  </Text>
                ) : (
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.4)",
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
              color: "rgba(255, 255, 255, 0.45)",
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            HISTORY
          </Text>

          <View
            style={{
              backgroundColor: "rgba(22, 22, 30, 0.85)",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.06)",
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
                    borderBottomColor: "rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <View>
                    <Text
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
                        style={{
                          color: colors.flash,
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
                    style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13 }}
                  >
                    {h.burns} burn{h.burns > 1 ? "s" : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.45)",
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
        initialGrade={displayGrade}
        lockGrade={true}
        disableFlash={hasPriorAttempts}
        initialResult="attempt"
        initialAttempts={1}
        initialNotes=""
        title={`Log Attempt • ${displayTitle}`}
      />

      {/* Feedback Toast with Undo */}
      <UndoToast
        visible={Boolean(toastMessage)}
        message={toastMessage || ""}
        onUndo={handleUndo}
        onDismiss={() => setToastMessage(null)}
      />
    </View>
  );
}
