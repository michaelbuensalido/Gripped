import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable, Modal, Image } from "react-native";
import {
  Play,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Clock,
  Layers,
} from "lucide-react-native";
import Svg, { Polygon, Path } from "react-native-svg";
import type { RoutineWithBlocks, RoutineCategory } from "../../types";
import { GRADE_BY_LABEL } from "../../constants/grades";
import { FLOATING_CARD_STYLE } from "../../constants/theme";
import { triggerHaptic } from "../../utils/haptics";

interface RoutineCardProps {
  routine: RoutineWithBlocks;
  onStart: (routine: RoutineWithBlocks) => void;
  onEdit: (routine: RoutineWithBlocks) => void;
  onDuplicate: (routineId: string) => void;
  onDelete: (routineId: string) => void;
}

/**
 * Category color tokens matching design system specifications:
 * - Strength / Projecting: Deep Purple (#8E7CFF)
 * - Power Endurance: Coral / Crimson (#FF5C5C)
 * - Volume: Bright Lime Green (#6EE756)
 * - Technique: Sky Blue (#4DAFFF)
 * - Other: Muted Gray (#8E8E9A)
 */
const CATEGORY_STYLES: Record<
  RoutineCategory,
  { bg: string; text: string; border: string }
> = {
  Strength: {
    bg: "rgba(142, 124, 255, 0.15)",
    text: "#8E7CFF",
    border: "#8E7CFF",
  },
  Projecting: {
    bg: "rgba(142, 124, 255, 0.15)",
    text: "#8E7CFF",
    border: "#8E7CFF",
  },
  "Power Endurance": {
    bg: "rgba(255, 92, 92, 0.15)",
    text: "#FF5C5C",
    border: "#FF5C5C",
  },
  Volume: {
    bg: "rgba(110, 231, 86, 0.15)",
    text: "#6EE756",
    border: "#6EE756",
  },
  Technique: {
    bg: "rgba(77, 175, 255, 0.15)",
    text: "#4DAFFF",
    border: "#4DAFFF",
  },
  Other: {
    bg: "rgba(142, 142, 154, 0.15)",
    text: "#8E8E9A",
    border: "#8E8E9A",
  },
};

/**
 * 3D Hold Graphic based on routine category:
 * - 'volume' / 'technique' -> teal_ripple_disc.png
 * - 'power_endurance' -> yellow_jug.png
 * - 'strength' / 'projecting' -> pink_pinch.png
 */
function getCategoryHoldImage(category: RoutineCategory | string) {
  const norm = (category || "").toLowerCase().replace(/[\s_-]/g, "");
  if (norm.includes("volume") || norm.includes("technique")) {
    return require("../../assets/holds-images/teal_ripple_disc.png");
  }
  if (norm.includes("endurance")) {
    return require("../../assets/holds-images/yellow_jug.png");
  }
  if (norm.includes("strength") || norm.includes("projecting")) {
    return require("../../assets/holds-images/pink_pinch.png");
  }
  return require("../../assets/holds-images/teal_ripple_disc.png");
}

/**
 * Solid faceted 3D boulder glyph
 */
function MiniBoulderIcon({
  size = 13,
  color = "#8A8A96",
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

export function RoutineCard({
  routine,
  onStart,
  onEdit,
  onDuplicate,
  onDelete,
}: RoutineCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const catStyle = CATEGORY_STYLES[routine.category] ?? CATEGORY_STYLES.Other;
  const totalBoulders = routine.blocks.reduce(
    (acc, b) => acc + b.boulders.length,
    0,
  );

  // Compute concise Grade Span (e.g. "V3 – V5" or "V5")
  const gradeList = routine.blocks
    .flatMap((b) => b.boulders.map((bo) => bo.gradeRaw))
    .filter(Boolean);

  const sortedGrades = Array.from(new Set(gradeList)).sort((a, b) => {
    const diffA = GRADE_BY_LABEL[a]?.difficulty ?? 0;
    const diffB = GRADE_BY_LABEL[b]?.difficulty ?? 0;
    return diffA - diffB;
  });

  let gradeSpanText = "";
  if (sortedGrades.length === 1) {
    gradeSpanText = sortedGrades[0];
  } else if (sortedGrades.length > 1) {
    gradeSpanText = `${sortedGrades[0]} – ${sortedGrades[sortedGrades.length - 1]}`;
  }

  return (
    <View
      style={[
        FLOATING_CARD_STYLE,
        {
          borderRadius: 20,
          padding: 20,
          marginHorizontal: 16,
          marginBottom: 16,
        },
      ]}
    >
      {/* ── Top Header Row: Category Badge (Left) + 3-Dot Menu (Right) ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        {/* Category Badge: Bold, compact rounded pill */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Text
            style={{
              color: catStyle.text,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.5,
            }}
            className="uppercase"
          >
            {routine.category}
          </Text>
        </View>

        {/* 3-Dot Context Menu Button with 44x44 tap target */}
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MoreVertical size={18} color="#8A8A98" />
        </TouchableOpacity>
      </View>

      {/* ── Title Row: Direct 3D Hold + Routine Title + Grade Pill ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: routine.description ? 8 : 14,
        }}
      >
        {/* Hold Display: 3D hold floating unboxed directly on the card canvas */}
        <Image
          source={getCategoryHoldImage(routine.category)}
          style={{ width: 44, height: 44 }}
          resizeMode="contain"
        />

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: "700",
            letterSpacing: -0.3,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {routine.title}
        </Text>

        {/* Grade Pill: Lime green solid pill (#6EE756) with dark bold text (#111115), font size 12pt */}
        {gradeSpanText ? (
          <View
            style={{
              backgroundColor: "#6EE756",
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 3,
              shadowColor: "#6EE756",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: "#111115",
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 0.3,
              }}
            >
              {gradeSpanText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Optional Description */}
      {routine.description ? (
        <Text
          style={{
            color: "#9A9AA6",
            fontSize: 13,
            lineHeight: 18,
            marginBottom: 14,
          }}
          numberOfLines={2}
        >
          {routine.description}
        </Text>
      ) : null}

      {/* ── Metadata Bar (Clean Icon Pills) ─────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Blocks */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Layers size={13} color="#8A8A96" />
          <Text style={{ color: "#9A9AA6", fontSize: 12.5, fontWeight: "500" }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {routine.blocks.length}
            </Text>{" "}
            Blocks
          </Text>
        </View>

        {/* Boulders / Problems */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <MiniBoulderIcon size={13} color="#8A8A96" />
          <Text style={{ color: "#9A9AA6", fontSize: 12.5, fontWeight: "500" }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {totalBoulders}
            </Text>{" "}
            Problems
          </Text>
        </View>

        {/* Duration */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Clock size={13} color="#8A8A96" />
          <Text style={{ color: "#9A9AA6", fontSize: 12.5, fontWeight: "500" }}>
            ~{routine.estimatedMinutes} min
          </Text>
        </View>
      </View>

      {/* ── Start Routine CTA Button with tactile compression ──── */}
      <Pressable
        onPress={() => {
          triggerHaptic('medium');
          onStart(routine);
        }}
        style={({ pressed }) => ({
          backgroundColor: "#8E7CFF",
          height: 52,
          borderRadius: 26,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          shadowColor: "#8E7CFF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 5,
          marginTop: 2,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "700",
            letterSpacing: 0.5,
          }}
        >
          START ROUTINE
        </Text>
      </Pressable>

      {/* ── Context Menu Modal ─────────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              backgroundColor: 'rgba(28, 28, 35, 0.94)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              borderTopWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              paddingBottom: 40,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#374151",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 16,
              }}
              numberOfLines={1}
            >
              {routine.title}
            </Text>

            {/* Edit */}
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                onEdit(routine);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              <Edit3 size={18} color="#FFFFFF" />
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
              >
                Edit Routine
              </Text>
            </TouchableOpacity>

            {/* Duplicate */}
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                onDuplicate(routine.id);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              <Copy size={18} color="#8E7CFF" />
              <Text
                style={{ color: "#8E7CFF", fontSize: 16, fontWeight: "600" }}
              >
                Duplicate as Custom
              </Text>
            </TouchableOpacity>

            {/* Delete (custom only) */}
            {routine.isCustom && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  onDelete(routine.id);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 14,
                  marginTop: 4,
                }}
              >
                <Trash2 size={18} color="#FF5C5C" />
                <Text
                  style={{ color: "#FF5C5C", fontSize: 16, fontWeight: "600" }}
                >
                  Delete Routine
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
