export const colors = {
  // Surfaces: translucent on dark speckled mat background
  bg: "transparent",
  bgTexture: "#050507",
  // Backdrop dimming: the speckled mat should sit far behind content
  backdropImageOpacity: 0.16,
  backdropScrimTop: "rgba(0, 0, 0, 0.35)",
  backdropScrimBottom: "rgba(0, 0, 0, 0.75)",
  card: "rgba(22, 22, 30, 0.92)",
  cardMuted: "rgba(28, 28, 38, 0.80)", // inset tiles, inputs, unselected chips
  border: "rgba(255, 255, 255, 0.06)",
  // Zero-state chart skeleton
  chartGhost: "rgba(255, 255, 255, 0.06)",
  chartGhostStrong: "rgba(255, 255, 255, 0.12)",

  // Text
  text: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.45)",
  textOnAccent: "#FFFFFF",

  // Accent: Primary Neon Violet / Lavender
  accent: "#9A85FF",
  accentPressed: "#846DE6",
  accentSoft: "rgba(154, 133, 255, 0.20)", // selected chip, active tab capsule
  accentText: "#D4CCFF",

  // Results: Secondary Neon Green & Reference Palette
  flash: "#72FF9B",
  flashSoft: "rgba(114, 255, 155, 0.18)",
  flashText: "#72FF9B",
  top: "#9A85FF",
  topSoft: "rgba(154, 133, 255, 0.18)",
  topText: "#D4CCFF",
  attempt: "#E2DCBA",
  attemptSoft: "rgba(226, 220, 186, 0.18)",
  attemptText: "#E2DCBA",
  fail: "#5E6068",
  failSoft: "rgba(94, 96, 104, 0.20)",
  failText: "#8E909A",

  // Grade bands (see Section 5)
  bandBeginnerSoft: "#2D303B",
  bandBeginnerText: "#B3C2DE",
  bandBeginner: "#8FA3C7",
  bandIntermediateSoft: "#1D363A",
  bandIntermediateText: "#6BDDD9",
  bandIntermediate: "#2FC7C2",
  bandAdvancedSoft: "#3C3124",
  bandAdvancedText: "#F6C46E",
  bandAdvanced: "#F0A93B",
  bandExpertSoft: "#38283B",
  bandExpertText: "#E59BDB",
  bandExpert: "#D473C8",

  // Feedback
  danger: "#FF4D4D",
  dangerSoft: "rgba(255, 77, 77, 0.15)",
  dangerText: "#FF9999",
  success: "#72FF9B",

  // Overlay
  scrim: "rgba(0, 0, 0, 0.75)",
  glass: "rgba(18, 18, 24, 0.85)",

  // Depth (v3.0)
  bevelHighlight: "rgba(255, 255, 255, 0.08)",
  bevelShadow: "rgba(0, 0, 0, 0.6)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glow: "rgba(154, 133, 255, 0.25)",

  // Translucent Materials (v4.0 Spatial Editorial)
  materialBase: "rgba(22, 22, 30, 0.92)",
  materialBorder: "rgba(255, 255, 255, 0.06)",
  materialHighlight: "rgba(255, 255, 255, 0.10)",

  // Translucent Typography
  textWhitePrimary: "#FFFFFF",
  textWhiteSecondary: "rgba(255, 255, 255, 0.60)",
  textWhiteMuted: "rgba(255, 255, 255, 0.40)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt grid

// v3.0: cards sit on a soft black shadow (the bevel supplies the edge light).
export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export const type = {
  display: {
    fontFamily: "Sora_400Regular",
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums" as const],
  },
  title: { fontFamily: "Sora_400Regular", fontSize: 22, lineHeight: 28, fontVariant: ["tabular-nums" as const] },
  stat: {
    fontFamily: "Sora_400Regular",
    fontSize: 36,
    lineHeight: 40,
    fontVariant: ["tabular-nums" as const],
  },
  statSm: {
    fontFamily: "Sora_400Regular",
    fontSize: 24,
    lineHeight: 28,
    fontVariant: ["tabular-nums" as const],
  },
  heading: { fontFamily: "Inter_400Regular", fontSize: 17, lineHeight: 22, fontVariant: ["tabular-nums" as const] },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, fontVariant: ["tabular-nums" as const] },
  control: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums" as const] },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2.5,
    fontVariant: ["tabular-nums" as const],
    textTransform: "uppercase" as const,
  },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums" as const] },
};

export const motion = {
  duration: { fast: 120, base: 200, slow: 320, celebrate: 900 }, // ms
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
  }, // cubic-bezier
  spring: { damping: 18, stiffness: 220 },
  // v3.0 fluid physics
  layoutSpring: { damping: 14, stiffness: 100 }, // list/grid items sliding into place
  pressSpring: { damping: 15, stiffness: 300, scale: 0.96 }, // PrimaryButton press-in
};

export const gradeBands = [
  { bg: "#2D303B", text: "#B3C2DE", solid: "#8FA3C7", label: "Beginner" },
  { bg: "#1D363A", text: "#6BDDD9", solid: "#2FC7C2", label: "Intermediate" },
  { bg: "#3C3124", text: "#F6C46E", solid: "#F0A93B", label: "Advanced" },
  { bg: "#38283B", text: "#E59BDB", solid: "#D473C8", label: "Expert" },
] as const;

export function gradeBand(gradeIndex: number): typeof gradeBands[number] {
  if (gradeIndex <= 2) return gradeBands[0];
  if (gradeIndex <= 5) return gradeBands[1];
  if (gradeIndex <= 8) return gradeBands[2];
  return gradeBands[3];
}
